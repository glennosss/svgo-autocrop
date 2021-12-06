'use strict';

const AutocropUtils = require('./lib/AutocropUtils');

exports.type = 'full';
exports.name = 'autocrop';
exports.active = true;
exports.description = 'reduce viewBox to minimum possible size so no wasted transparent space around svg';

/**
 * Reduce viewBox to minimum possible size so no wasted transparent space around svg.
 *
 * @example
 * <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
 *   <rect x="5" y="5" width="10" height="10" fill="#000"/>
 * </svg>
 *             ⬇
 * <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
 *   <rect x="0" y="0" width="10" height="10" fill="#000"/>
 * </svg>
 *
 * @author Glennos
 */
exports.fn = (ast, params, info) => {
	return AutocropUtils.plugin(ast, params, info);
};
