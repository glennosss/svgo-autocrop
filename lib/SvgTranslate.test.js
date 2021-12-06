
const SvgUtils = require('./SvgUtils');
const SvgTranslate = require('./SvgTranslate');

function assertTranslate(svg, x, y, expectedSvg) {
	let ast = SvgUtils.svg2js(svg);
	new SvgTranslate(x, y).translate(ast);
	let actualSvg = SvgUtils.js2svg(ast);
	expect(actualSvg).toBe(expectedSvg);
}

test('<svg><path> translate', () => {
	assertTranslate('<svg><path d="M20,230 Q40,205 50,230 T90,230" fill="none" stroke="blue" stroke-width="5"/></svg>',
		1, 2, '<svg><path d="M21 232Q41 207 51 232T91 232" fill="none" stroke="blue" stroke-width="5"/></svg>');
	assertTranslate('<svg><path d="M20,230 Q40,205 50,230 T90,230" fill="none" stroke="blue" stroke-width="5"/></svg>',
		10, 20, '<svg><path d="M30 250Q50 225 60 250T100 250" fill="none" stroke="blue" stroke-width="5"/></svg>');
	assertTranslate('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>',
		1, 2, '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M1 2H25V26H1z\"/><path d=\"M12.8 12.9C10.53 12.31 9.8 11.7 9.8 10.75C9.8 9.66 10.81 8.9 12.5 8.9C14.28 8.9 14.94 9.75 15 11H17.21C17.14 9.28 16.09 7.7 14 7.19V5H11V7.16C9.06 7.58 7.5 8.84 7.5 10.77C7.5 13.08 9.41 14.23 12.2 14.9C14.7 15.5 15.2 16.38 15.2 17.31C15.2 18 14.71 19.1 12.5 19.1C10.44 19.1 9.63 18.18 9.52 17H7.32C7.44 19.19 9.08 20.42 11 20.83V23H14V20.85C15.95 20.48 17.5 19.35 17.5 17.3C17.5 14.46 15.07 13.49 12.8 12.9z\"/></svg>');
});

test('<svg><rect> translate', () => {
	assertTranslate('<svg><rect x="5" y="5" width="10" height="10" fill="#000"/></svg>',
		-5, -5, '<svg><rect x="0" y="0" width="10" height="10" fill="#000"/></svg>');
	assertTranslate('<svg><rect x="5" y="5" width="10" height="10" fill="#000"/></svg>',
		-10, -15, '<svg><rect x="-5" y="-10" width="10" height="10" fill="#000"/></svg>');
	assertTranslate('<svg><g><g><rect x="60" y="10" rx="10" ry="10" width="30" height="30"/></g></g></svg>',
		1, 2, '<svg><g><g><rect x="61" y="12" rx="10" ry="10" width="30" height="30"/></g></g></svg>');
	assertTranslate('<svg><g fill="white" stroke="green" stroke-width="5"><rect y="5" x="5" width="10" height="10" fill="#000"/></g></svg>',
		-4, -3, '<svg><g fill="white" stroke="green" stroke-width="5"><rect y="2" x="1" width="10" height="10" fill="#000"/></g></svg>');
});

test('<svg><line> translate', () => {
	assertTranslate('<svg><line x1="10" x2="50" y1="110" y2="150" stroke="black" stroke-width="5"/></svg>',
		1, 2, '<svg><line x1="11" x2="51" y1="112" y2="152" stroke="black" stroke-width="5"/></svg>');
	assertTranslate('<svg><g><g><g><line y1="0" y2="10" x1="0" x2="10" stroke="black"/></g></g></g></svg>',
		-10, -15, '<svg><g><g><g><line y1="-15" y2="-5" x1="-10" x2="0" stroke="black"/></g></g></g></svg>');
});

test('<svg><circle> translate', () => {
	assertTranslate('<svg><circle cx="25" cy="75" r="20"/></svg>',
		1, 2, '<svg><circle cx="26" cy="77" r="20"/></svg>');
	assertTranslate('<svg><g><g><circle cx="0" cy="0" r="5" stroke="black"/></g></g></svg>',
		-10, -15, '<svg><g><g><circle cx="-10" cy="-15" r="5" stroke="black"/></g></g></svg>');
});

test('<svg><ellipse> translate', () => {
	assertTranslate('<svg><ellipse cx="75" cy="75" rx="20" ry="5"/></svg>',
		1, 2, '<svg><ellipse cx="76" cy="77" rx="20" ry="5"/></svg>');
	assertTranslate('<svg><g><g><ellipse cx="0" cy="0" rx="5" ry="6" stroke="black"/></g></g></svg>',
		-10, -15, '<svg><g><g><ellipse cx="-10" cy="-15" rx="5" ry="6" stroke="black"/></g></g></svg>');
});
