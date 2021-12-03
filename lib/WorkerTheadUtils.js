
const {Worker, isMainThread, parentPort, workerData} = require('worker_threads');

const ERROR_BUFFER_TOO_SMALL = -100;
const ERROR_ZERO_OR_NEGATIVE_BYTES_WRITTEN = -101;

/**
 * This worker thread approach was created to solve issues with
 * running async code within SVGO's non-async plugin framework.
 *
 * This code solves the substantial issues involved in running a long running puppeteer (i.e. chrome headless webbrowser) instance within SVGO.
 * Specifically;
 *   (*) SVGO has no way to run async plugins. And even if it added it, it'd break all the many, many people who use SVGO. It's never-the-less been requested by users: https://github.com/svg/svgo/issues/972
 *   (*) SVGO has no way to allow a plugin to register callback which will be called when SVGO completes optimising *all* SVGs or right before SVO is about to exit.
 *   (*) Shutdown hooks/etc don't solve the previous issue - because when something like puppeteer is running, these shutdown hooks never get called.
 */

/**
 * Client/parent (i.e. the one running the worker thread).
 */
module.exports.WorkerTheadClient = class WorkerTheadClient {
	/**
	 * @param filename See filename as described here: https://nodejs.org/api/worker_threads.html#new-workerfilename-options
	 *    [** IF FILENAME DOESN'T APPEAR TO BE LOADING - RUN SCRIPT DIRECTLY TO SEE IF IT EVEN LOADS **]
	 */
	constructor(filename, isDebug = false) {
		if ( !isMainThread ) {
			throw new Error("This code shouldn't be run from a worker thread");
		} else if ( isDebug ) {
			console.info('Creating worker which will load: ' + filename);
		}
		let worker = new Worker(filename, {workerData: {isDebug:isDebug}});
		if ( !isDebug ) {
			// Terminate worker when app would normally exit
			worker.unref(); // See https://nodejs.org/dist./v10.22.0/docs/api/worker_threads.html#worker_threads_worker_unref
		} else {
			// Don't terminate app when it would normally exit - instead leave worker running so can see debug messages - will have to manually terminate the app.
			worker.on('online', () => {
				console.log('Worker is running');
			});
			worker.on('message', (message) => {
				console.error('Unexpected message received from worker: ', message);
			});
			worker.on('error', (error) => {
				console.error('Worker error: ', error);
			});
			worker.on('messageerror', (error) => {
				console.error('Worker message error: ', error);
			});
			worker.on('exit', (status) => {
				console.log('Worker exited with status ' + status);
			});
		}
		this.worker = worker;
		this.isDebug = isDebug;
	}

	/**
	 * @param timeout Maximum milliseconds to wait for response. Defaults to 5 seconds. Set to undefined for Infinity. See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait
	 * @param responseBufferSize Defaults to 16kb/16384 bytes - but can be adjusted as required.
	 */
	sendRequest(request, timeout = 5000, responseBufferSize = 16384) {
		let worker = this.worker;
		let isDebug = this.isDebug;
		if ( !worker ) {
			throw new Error('No active worker to send request to');
		} else if ( isDebug ) {
			console.info('Sending request: ', request);
		}

		// Create shared buffer used to get response from worker thread
		let shared = new SharedArrayBuffer(responseBufferSize);
		const array = new Int32Array(shared, 0, 4); // 4 bytes storing length to parse.

		// Send message to worker thread
		worker.postMessage({request:request, shared:shared});

		// Wait for response - timeout after 5 seconds.
		Atomics.wait(array, 0, 0, timeout);

		// Read responseCode/length
		let responseCode = Atomics.load(array, 0);
		if ( responseCode==0 ) {
			throw new Error('No response from worker thread after 5 seconds');
		} else if ( responseCode<0 || responseCode>responseBufferSize-4 ) {
			throw new Error("Worker thread returned invalid responseCode/length=" + length);
		}

		// Read/parse response
		let json = new TextDecoder().decode(new Uint8Array(shared, 4, responseCode));
		let response;
		try {
			response = JSON.parse(json);
		} catch (e) {
			throw new Error('Failed to parse json=' + json, e);
		}
		let error = response.error;
		if ( error ) {
			throw new Error('Worker failed with error: ' + error);
		}
		if ( isDebug ) {
			console.info('Received response: ', response);
		}
		return response;
	}

	close() {
		let worker = this.worker;
		if ( !worker ) {
			throw new Error('Worker already closed');
		} else if ( this.debug ) {
			console.info('Closing worker');
		}
		this.worker = null;
		worker.terminate();
	}
}

/**
 * Server/worker thread (i.e. the separate worker thread process).
 */
module.exports.WorkerTheadServer = class WorkerTheadServer {
	constructor() {
		this.isDebug = workerData.isDebug;
		if ( isMainThread ) {
			throw new Error('This code should only be run as a worker thread');
		}
		parentPort.on('message', async (message) => {
			let request = message.request;
			let shared = message.shared;
			if ( this.isDebug ) {
				console.log('Worker received request: ', request);
			}
			try {
				await this.onRequest(request, shared);
			} catch ( e ) {
				console.error('Worker failed to process request: ', e);
				if ( e && e.stack ) {
					this.sendResponse({error: '' + e.stack}, shared);
				} else {
					this.sendResponse({error: '' + e}, shared);
				}
			}
		});
	}

	// Extending implementation must specify:
	//   async onRequest(request, shared);

	sendResponse(response, shared) {
		if ( this.isDebug ) {
			console.info('Sending response: ', response);
		}
		let json = JSON.stringify(response);

		// Write response into shared memory
		let responseCode;
		{
			let result = new TextEncoder().encodeInto(json, new Uint8Array(shared, 4)); // Encode into buffer from byte 4 to end of buffer.
			let charsRead = result.read;
			let bytesWritten = result.written;
			if ( charsRead!=json.length ) {
				console.error('Buffer not large enough to write full response; json.length=' + json.length + ', charsRead=' + charsRead + ', bytesWritten=' + bytesWritten);
				responseCode = ERROR_BUFFER_TOO_SMALL;
			} else if ( bytesWritten<=0 ) {
				console.error('Zero or negative number of bytes written; json.length=' + json.length + ', charsRead=' + charsRead + ', bytesWritten=' + bytesWritten);
				responseCode = ERROR_ZERO_OR_NEGATIVE_BYTES_WRITTEN;
			} else {
				responseCode = bytesWritten;
			}
		}

		// Write **non-zero** responseCode and notify parent
		const array = new Int32Array(shared, 0, 4);
		Atomics.store(array, 0, responseCode);
		Atomics.notify(array, 0); // Notify all waiting threads index 0 has been written to.
	}
}
