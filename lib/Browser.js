
const Ensure = require('./Ensure');
const Puppeteer = Ensure.object(require('puppeteer'));

module.exports = class Browser {
	constructor() {
		this.browser = null;
		this.page = null;
		this.pageInUse = false;
	}

	async start() {
		let browser = await Puppeteer.launch();
		this.browser = browser;
		this.page = await browser.newPage();
	}

	/**
	 * page.screenshot; see https://pptr.dev/#?product=Puppeteer&version=v12.0.1&show=api-pagescreenshotoptions
	 *
	 * @param html Html to take a screenshot of.
	 * @param clipBounds Clip bounds - taking the form {x, y, width, height}.
	 * @return Returns png bytes.
	 */
	async getPngScreenshot(html, clipBounds) {
		let page = this.page;
		if (! page ) {
			throw new Error('Browser not started/already stopped');
		} else if ( this.pageInUse ) {
			throw new Error('Page currently in use');
		}

		// Load html and take screenshot
		try {
			this.pageInUse = true;
			await page.setContent(html); // FYI Much more performant to set html to page - rather than writing html to file and loading using "goto()".
			return await page.screenshot({
				type: 'png',
				encoding: 'binary',
				omitBackground: true,
	            clip: clipBounds
			});
		} finally {
			this.pageInUse = false;
		}
	}

	async close() {
		// Close browser
		let browser = this.browser;
		if (! browser ) {
			throw new Error('Browser not started/already stopped');
		}
		this.browser = null;
		this.page = null;
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
