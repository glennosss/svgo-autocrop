
const Ensure = require('./Ensure');

const WorkerTheadServer = Ensure.clazz(require('./WorkerTheadUtils').WorkerTheadServer);

const Browser = Ensure.clazz(require('./Browser'));
const ImageUtils = Ensure.clazz(require('./ImageUtils'));
const fs = Ensure.object(require('fs'));

class WorkerThead extends WorkerTheadServer {
	/**
	 * @override
	 */
	async onRequest({svg, width, height, debugWriteFilePrefix}, shared) {
		if ( !svg ) {
			throw new Error('No svg provided');
		} else if ( width<=0 || height<=0 ) {
			throw new Error('Invalid width/height provided; width=' + width + ', height=' + height);
		}

		// Get/start chrome headless webbrowser
		let browser = this.browser;
		if ( !browser ) {
			browser = new Browser();
			await browser.start();
			this.browser = browser;
		}

		// Use browser to take transparent png screenshot of svg
		let html = Browser.getHtml(svg);
		let imageBytes = await browser.getPngScreenshot(html, {x:0, y:0, width:width, height:height});
		if ( debugWriteFilePrefix ) {
			fs.writeFileSync(debugWriteFilePrefix + ".png", imageBytes);
			fs.writeFileSync(debugWriteFilePrefix + ".html", html);
		}

		// Load png image and calculate non-transparent bounds
		let response = await ImageUtils.getBounds(imageBytes);
		this.sendResponse(response, shared);
	}
}

new WorkerThead();
