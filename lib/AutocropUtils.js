
const Ensure = require('./Ensure');
const path = Ensure.object(require('path'));

const WorkerTheadParent = Ensure.clazz(require('./WorkerTheadParent'));

const stringifySvg = Ensure.func(require(path.dirname(require.resolve('svgo')) + '/stringifier.js').stringifySvg); // Ugly way of loading "{repo}/node_modules/svgo/lib/stringifier.js".

module.exports = class AutocropUtils {

	/**
	 * params.includeWidthAndHeightAttributes - if undefined, only updated width/height if SVG already has width/height. If true, writes width/height. If false, deletes width/height.
	 * params.debug - log old/new viewbox to console.
	 * params.debugWriteFiles - writes "${srcSvg}.png" and "${srcSvg}.html" file to disk for easier debugging.
	 * params.debugWorkerThread - log all worker thread communication. Warning: have to manually terminate terminate application when this is true.
	 */
	static plugin(ast, params, info) {
		// Only run on first call
		if ( info.multipassCount!==0 ) {
			return;
		}

		// Get <svg> attributes
		let attribs = AutocropUtils.getSvgAttribs(ast);
		let includeWidthAndHeightAttributes = AutocropUtils.isIncludeWidthAndHeightAttributes(params, attribs);

		// Get viewbox
		let viewbox = AutocropUtils.getViewbox(attribs);
		let width = viewbox.width;
		let height = viewbox.height;

		// Ensure width/height set (need svg to be fixed size rather than scaling to screen)
		attribs.width = '' + width;
		attribs.height = '' + height;

		// Use worker thread running chrome headless webbrowser to take transparent png screenshot of svg, load png image and then calculate/return non-transparent bounds.
		let bounds = WorkerTheadParent.getBounds(stringifySvg(ast).data, width, height,
			AutocropUtils.getDebugWriteFilePrefix(params, info), params.debugWorkerThread);
		if ( bounds.width!=width || bounds.height!=height ) {
			throw new Error('Loaded png had unexpected width/height\n<svg viewbox>=' + JSON.stringify(viewbox) + ', png bounds=' + JSON.stringify(bounds));
		}

		// Set the new viewbox to the svg
		let viewboxNew = {
			x: viewbox.x + bounds.xMin,
			y: viewbox.y + bounds.yMin,
			width: bounds.xMax - bounds.xMin + 1,
			height: bounds.yMax - bounds.yMin + 1
		};
		AutocropUtils.setViewbox(attribs, viewboxNew, includeWidthAndHeightAttributes);

		// Log if requested
		if ( params.debug ) {
			console.log('Old viewbox: ' + JSON.stringify(viewbox) + '. New viewbox: ' + JSON.stringify(viewboxNew));
		}
	}

	static getSvgAttribs(ast) {
		let nodes = ast.children;
		let nodeCount;
		if ( !nodes || (nodeCount=nodes.length)<=0 ) {
			throw new Error('AST contains no nodes');
		}
		let index = 0;
		let svg;
		do {
			let node = nodes[index];
			if ( node.type=='element' && node.name=='svg' ) {
				if ( svg ) {
					throw new Error('AST contains multiple root <svg> elements');
				}
				svg = node;
			}
		} while ( ++index<nodeCount );
		if ( !svg ) {
			throw new Error("AST didn't contain root <svg> element");
		}
		return Ensure.notNull(svg.attributes, "<svg> attributes");
	}

	static getDebugWriteFilePrefix(params, info) {
		let value = params.debugWriteFiles;
		if (! value ) {
			return null;
		}
		let type = typeof value;
		if ( type=='boolean' ) {
			let path = info.path;
			if ( !path ) {
				throw new Error("Param 'debugWriteFiles' enabled - but couldn't determine path of SVG - set 'debugWriteFiles' to path instead so can write debug files");
			}
			return path;
		} else if ( type=='string' ) {
			return value;
		} else {
			throw new Ensure.unexpectedObject("Unknown 'debugWriteFiles' params value specified", value);
		}
	}

	static isIncludeWidthAndHeightAttributes(params, attribs) {
		let flag = params.includeWidthAndHeightAttributes;
		let type = typeof(flag);
		if ( type=='undefined' ) { // Default to including only if already included in svg.
			flag = attribs.width || attribs.height;
		} else if ( type!='boolean' ) {
			throw Ensure.unexpectedObject("Invalid 'includeWidthAndHeightAttributes' param - expected either 'boolean' or 'undefined' (which defaults to true/false depending on whether svg already includes a width/height", flag);
		}
		return flag;
	}
	
	/**
	 * @return Returns object taking the form {x, y, width, height}.
	 */
	static getViewbox(attribs) {
		let viewbox = attribs.viewBox;
		let x, y, width, height;
		if ( !viewbox ) {
			x = 0;
			y = 0;
			height = Ensure.integer(attribs.height, '<svg height>');
			width = Ensure.integer(attribs.width, '<svg width>');
		} else {
			Ensure.string(viewbox, '<svg viewbox>');
			let array = viewbox.split(/[ ,]+/);
			if ( array instanceof Array && array.length!=4 ) {
				throw new Error("Invalid <svg viewbox='" + viewbox + "'> attribute - expected viewbox to specify 4 parts.");
			}
			x = Ensure.integer(array[0], '<svg viewbox[0]>');
			y = Ensure.integer(array[1], '<svg viewbox[1]>');
			width = Ensure.integer(array[2], '<svg viewbox[2]>');
			height = Ensure.integer(array[3], '<svg viewbox[3]>');

			// Ensure width attribute matches if provided
			let width2 = attribs.width;
			if ( width2 ) {
				width2 = Ensure.integer(width2, '<svg width>')
				if ( width!=width2 ) {
					throw new Error('Inconsistent widths: <svg viewbox> specifies width of ' + width + ', but <svg width> is ' + width2);
				}
			}

			// Ensure height attribute matches if provided
			let height2 = attribs.height;
			if ( height2 ) {
				height2 = Ensure.integer(height2, '<svg height>')
				if ( height!=height2 ) {
					throw new Error('Inconsistent heights: <svg viewbox> specifies height of ' + height + ', but <svg height> is ' + height2);
				}
			}
		}
		return {x, y, width, height};
	}

	static setViewbox(attribs, viewbox, includeWidthAndHeightAttributes) {
		let width = viewbox.width;
		let height = viewbox.height;

		// Either update or set width/height
		if ( includeWidthAndHeightAttributes ) {
			attribs.width = '' + width;
			attribs.height = '' + height;
		} else {
			delete attribs.width;
			delete attribs.height;
		}

		// Set viewbox
		attribs.viewBox = viewbox.x + ' ' + viewbox.y + ' ' + width + ' ' + height;
	}

}
