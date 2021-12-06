
const Ensure = require('./Ensure');

const SVGPathData = Ensure.clazz(require('svg-pathdata').SVGPathData);

module.exports = class SvgTranslate {

	constructor(x, y, removeClass = false) {
		this.x = x;
		this.y = y;
		this.removeClass = removeClass;
	}

	/**
	 * Translate the ast by (x, y).
     *
     * Implementation works off a whitelist of known svg elements/attributes - if anything unknown is encountered, an exception is thrown.
     * If an exception is thrown, the caller has to rollback the ast themselves to the original unmodified version.
	 */
	translate(ast) {
		if ( ast.type!='root' ) {
			throw Ensure.unexpectedObject('Expected root', ast);
		}
		for ( const child of ast.children ) {
			const name = child.name;
			if ( name=='svg' && child.type=='element' ) {
				this.#svg(child);
			} else if ( name=='xml' && child.type=='instruction' ) {
				// Just ignore <?xml ... ?> tags
			} else {
				throw Ensure.unexpectedObject('Unhandled node', child);
			}
		}
	}

	#svg(svg) {
		const attribs = svg.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='viewBox' ) {
				// TODO maybe do something?
			} else if ( attribName=='width' || attribName=='height' || attribName=='xmlns' || attribName=='version' ) {
				// Ignore
			} else {
				this.#unhandledAttribute(svg, attribs, attribName);
			}
		}
		this.#handleChildren(svg);
	}

	#handleChildren(node) {
		for ( const child of node.children ) {
			const type = child.type;
			if ( type=='element' ) {
				const name = child.name;
				if ( name=='g' ) {
					this.#g(child);
				} else if ( name=='path' ) {
					this.#path(child);
				} else if ( name=='rect' ) {
					this.#rect(child);
				} else if ( name=='line' ) {
					this.#line(child);
				} else if ( name=='circle' ) {
					this.#circle(child);
				} else if ( name=='ellipse' ) {
					this.#ellipse(child);
				} else if ( name=='defs' ) {
					this.#defs(child);
				} else if ( name=='title' || name=='desc' ) {
					// Can just ignore title/description
				} else {
					throw Ensure.unexpectedObject('Unhandled element', child);				
				}
			} else if ( type=='comment' ) {
				// Can ignore comments
			} else {
				throw Ensure.unexpectedObject('Unhandled node type "' + type + '"', child);
			}
		}
	}

	#ensureNoChildren(node) {
		let children = node.children;
		if ( children && children.length>0 ) {
			throw Ensure.unexpectedObject('Unexpected/unhandled children', node);
		}
	}

	#unhandledAttribute(node, attribs, attribName) {
		if ( attribName ) {
			if (attribName=='id'
			    || attribName=='fill' || attribName.startsWith('fill-')
				|| attribName=='stroke' || attribName.startsWith('stroke-')
				|| attribName.startsWith('xmlns:')
				|| attribName=='sketch:type') {
				return; // Can safely ignore these.
			} else if ( attribName=='class' ) {
				if ( this.removeClass ) {
					delete attribs[attribName];
				}
				return;
			}
		}
		throw Ensure.unexpectedObject('Unhandled <' + node.name + ' ' + attribName + '> attribute', node);
	}

	#translateX(node, attribs, attribName) {
		let num = this.#getAttribNumber(node, attribs, attribName);
		let x = this.x;
		if ( x!==0 ) {
			attribs[attribName] = '' + (num + x);
		}
	}

	#translateY(node, attribs, attribName) {
		let num = this.#getAttribNumber(node, attribs, attribName);
		let y = this.y;
		if ( y!==0 ) {
			attribs[attribName] = '' + (num + y);
		}
	}

	#getAttribNumber(node, attribs, attribName) {
		let str = attribs[attribName];
		if ( typeof str != 'string' ) {
			throw Ensure.unexpectedObject('Invalid <' + node.name + ' ' + attribName + '> attribute - expected string', node);
		} else if ( str.length<=0 ) {
			throw Ensure.unexpectedObject('Invalid <' + node.name + ' ' + attribName + '> attribute - empty string specified for attribute', node);
		}
		let num = Number(str);
		if (! isFinite(num) ) {
			throw Ensure.unexpectedObject('Invalid <' + node.name + ' ' + attribName + '="' + str + '"> attribute - invalid number', node);
		}
		return num;
	}

	#defs(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs
		const attribs = node.attributes;
		for ( const attribName in attribs ) {
			this.#unhandledAttribute(node, attribs, attribName);
		}
		this.#ensureNoChildren(node);
	}

	#g(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g
		const attribs = node.attributes;
		for ( const attribName in attribs ) {
			this.#unhandledAttribute(node, attribs, attribName);
		}
		this.#handleChildren(node);
	}

	#path(path) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#path
		const attribs = path.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='d' ) {
				let data = attribs.d;
				let dataNew = new SVGPathData(data).toAbs().translate(this.x, this.y).round(1e14).encode();
				attribs.d = dataNew;
			} else {
				this.#unhandledAttribute(path, attribs, attribName);
			}
		}
		this.#ensureNoChildren(path);
	}

	#rect(path) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#rectangle
		const attribs = path.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='x' ) {
				this.#translateX(path, attribs, attribName);
			} else if ( attribName=='y' ) {
				this.#translateY(path, attribs, attribName);
			} else if ( attribName=='width' || attribName=='height' || attribName=='rx' || attribName=='ry' ) {
				// Can safely ignore these
			} else {
				this.#unhandledAttribute(path, attribs, attribName);
			}
		}
		this.#ensureNoChildren(path);
	}

	#line(path) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#line
		const attribs = path.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='x1' || attribName=='x2' ) {
				this.#translateX(path, attribs, attribName);
			} else if ( attribName=='y1' || attribName=='y2' ) {
				this.#translateY(path, attribs, attribName);
			} else {
				this.#unhandledAttribute(path, attribs, attribName);
			}
		}
		this.#ensureNoChildren(path);
	}

	#circle(path) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#circle
		const attribs = path.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='cx' ) {
				this.#translateX(path, attribs, attribName);
			} else if ( attribName=='cy' ) {
				this.#translateY(path, attribs, attribName);
			} else if ( attribName=='r' ) {
				// Can safely ignore these
			} else {
				this.#unhandledAttribute(path, attribs, attribName);
			}
		}
		this.#ensureNoChildren(path);
	}

	#ellipse(path) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#ellipse
		const attribs = path.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='cx' ) {
				this.#translateX(path, attribs, attribName);
			} else if ( attribName=='cy' ) {
				this.#translateY(path, attribs, attribName);
			} else if ( attribName=='rx' || attribName=='ry' ) {
				// Can safely ignore these
			} else {
				this.#unhandledAttribute(path, attribs, attribName);
			}
		}
		this.#ensureNoChildren(path);
	}

}
