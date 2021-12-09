
const Ensure = require('./Ensure');
const Puppeteer = Ensure.object(require('puppeteer'));

module.exports = class Browser {
	constructor() {
		this.browser = null;
		this.pages = [];
	}

	async start() {
		this.browser = await Puppeteer.launch();
	}

	/**
	 * page.screenshot; see https://pptr.dev/#?product=Puppeteer&version=v12.0.1&show=api-pagescreenshotoptions
	 *
	 * @param html Html to take a screenshot of.
	 * @param clipBounds Clip bounds - taking the form {x, y, width, height}.
	 * @return Returns png bytes.
	 */
	async getPngScreenshot(html, clipBounds) {
		// Get browser
		let browser = this.browser;
		if (! browser ) {
			throw new Error('Browser not started/already stopped');
		}

		// Attempt to reuse exising page. Otherwise create new page if non available.
		let pages = this.pages;
		let page = pages.pop();
		if (! page ) {
			page = await browser.newPage();
		}

		// Load html and take screenshot
		try {
			await page.setContent(html); // FYI Much more performant to set html to page - rather than writing html to file and loading using "goto()".
			return await page.screenshot({
				type: 'png',
				encoding: 'binary',
				omitBackground: true,
	            clip: clipBounds
			});
		} finally {
			pages.push(page); // Return page to array of available pages.
		}
	}

	async close() {
		// Get browser
		let browser = this.browser;
		if (! browser ) {
			throw new Error('Browser not started/already stopped');
		}

		// Close browser
		this.browser = null;
		this.pages = [];
		await browser.close();
	}

	static getHtml(body) {
		return '<!doctype html>\n'
			+ '<html><head>\n'
			+ '  <style>\n'
			+ '    html, body, body > * {\n'
			+ '      display: block;\n'
			+ '      background-color: transparent;\n'
			+ '      overflow: hidden;\n'
			+ '      margin: 0;\n'
			+ '      padding: 0;\n'
			+ '    }\n'
			+ '  </style>\n'
			+ '</head><body>' + body + '</body></html>';
	}
}
