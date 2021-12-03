
const Ensure = require('./Ensure');
const WorkerTheadClient = Ensure.clazz(require('./WorkerTheadUtils').WorkerTheadClient);

module.exports = class WorkerTheadParent {

	static getBounds(svg, width, height, // Main options
			debugWriteFilePrefix, debugWorkerThread) { // Debug options
		let worker = WorkerTheadParent.getWorker(debugWorkerThread);
		let response = worker.sendRequest({
			svg: Ensure.string(svg),
			width: Ensure.integerStrict(width),
			height: Ensure.integerStrict(height),
			debugWriteFilePrefix: debugWriteFilePrefix
		});
		return response;
	}

	static getWorker(debugWorkerThread) {
		let worker = WorkerTheadParent.WORKER;
		if ( worker!=null ) {
			return worker;
		}
		return (WorkerTheadParent.WORKER = new WorkerTheadClient(__dirname + '/WorkerThead.js', debugWorkerThread));
	}

}
