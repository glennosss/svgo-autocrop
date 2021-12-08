
const Ensure = require('./Ensure');

const SVGPathData = Ensure.clazz(require('svg-pathdata').SVGPathData);
const SvgTranslateError = Ensure.clazz(require('./SvgTranslateError'));

module.exports = class SvgTranslate {

	/**
	 * @removeClass If true, then delete 'class' attribute.
	 * @removeDeprecated If true, then delete <svg version/baseProfile> attributes. Also deletes other non-standard/not useful attributes like 'sketch:type'/'data-name'/etc.
     * @setColor If provided, then replace all colors with color specified. Usually set to 'currentColor'.
     * @setColorIssue Either undefined/'warn', 'fail', 'rollback' or 'ignore'. See "README.md#Parameters" for a full description of these values.
	 */
	constructor(x, y, multipassCount,
			removeClass = false, removeDeprecated = false, setColor = undefined, setColorIssue = undefined) {
		this.x = x;
		this.y = y;
		this.multipassCount = multipassCount;

		this.removeClass = removeClass;
		this.removeDeprecated = removeDeprecated;

		this.setColor = setColor;
		this.previousColor = null; // Used to store lowercase color previously encountered. If 'setColor' is defined and we encounter more than one color, then we fail.
		if ( !setColorIssue || setColorIssue=='warn' ) {
			this.setColorIssue = null;
		} else if ( setColorIssue=='fail' || setColorIssue=='rollback' || setColorIssue=='ignore' ) {
			this.setColorIssue = setColorIssue;
		} else {
			throw Ensure.unexpectedObject('Invalid "params.setColorIssue" value specified', setColorIssue);
		}
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
			const type = child.type;
			if ( type=='element' && child.name=='svg' ) {
				this.#svg(child);
			} else if ( type=='comment' || type=='instruction' || type=='doctype' ) {
				// Can ignore comments and instructions like <?xml ... ?>
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
			} else if ( attribName=='width' || attribName=='height' || attribName=='xmlns' || attribName=='enable-background' ) {
				// Ignore
			} else if ( attribName=='version' || attribName=='baseProfile' ) {
				if ( this.removeDeprecated ) { // Remove deprecated if requested
					delete attribs[attribName];
				}
			} else if ( attribName=='x' || attribName=='y' ) {
				let str = attribs[attribName];
				if ( !str || str=='0' || str=='0px' ) {
					delete attribs[attribName]; // Can just remove this - completely redundant.
				} else {
					this.#unhandledAttribute(svg, attribs, attribName);
				}
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
				const name = child.name.toLowerCase();
				if ( name=='g' ) {
					this.#g(child);
				} else if ( name=='path' ) {
					this.#path(child);
				} else if ( name=='rect' ) {
					this.#rect(child);
				} else if ( name=='line' ) {
					this.#line(child);
				} else if ( name=='polyline' ) {
					this.#polyline(child);
				} else if ( name=='polygon' ) {
					this.#polygon(child);
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
		if ( attribName ) { // For full list, see: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute
			if (attribName=='fill' || attribName=='stroke' || attribName=='color'
				|| attribName=='stop-color' || attribName=='flood-color' || attribName=='lighting-color' ) {
				this.#translateColor(node, attribs, attribName);
				return;
			} else if (attribName=='id'
				|| attribName=='opacity' || attribName=='display' || attribName=='style' || attribName=='font-family' || attribName=='overflow' || attribName=='enable-background'
			    || attribName.startsWith('fill-')
				|| attribName.startsWith('stroke-')
				|| attribName.startsWith('clip-') // i.e. 'clip-rule'
				|| attribName.startsWith('xmlns:') || attribName.startsWith('xml:')) {
				return; // Can somewhat safely ignore these.
			} else if ( attribName=='class' ) {
				if ( this.removeClass ) {
					delete attribs[attribName];
				}
				return;
			} else if ( attribName=='sketch:type' || attribName=='data-name' ) {
				if ( this.removeDeprecated ) { // Remove deprecated if requested
					delete attribs[attribName];
				}
				return;
			} else if ( attribName=='transform' ) {
				let multipassCount = this.multipassCount;
				if ( multipassCount===0 ) {
					throw SvgTranslateError.silentRollback("Svgo's 'convertTransform' plugin will often remove transforms. During the next run potentially no transform attribute will be present.");
				} else {
					throw Ensure.unexpectedObject("Svgo's 'convertTransform' is either not enabled or failed to remove <" + node.name + " transform='" + attribs[attribName] + "'> on the first pass.\n"
						+ "If this was a simple transform, consider confirming the svgo default plugins or at least the 'convertTransform' plugin are in your svgo configuration file.", node);
				}
			}
		}
		throw Ensure.unexpectedObject('Unhandled <' + node.name + ' ' + attribName + '> attribute', node);
	}

	#translateX(node, attribs, attribName) {
		let x = this.x;
		if ( x!==0 ) {
			let num = this.#getAttribNumber(node, attribs, attribName);
			attribs[attribName] = '' + (num + x);
		}
	}

	#translateY(node, attribs, attribName) {
		let y = this.y;
		if ( y!==0 ) {
			let num = this.#getAttribNumber(node, attribs, attribName);
			attribs[attribName] = '' + (num + y);
		}
	}

	#translateColor(node, attribs, attribName) {
		let setColor = this.setColor;
		if ( setColor ) {
			let str = this.#getAttribString(node, attribs, attribName).toLowerCase();
			if ( str!='none' ) {
				let previousColor = this.previousColor;
				if ( !previousColor ) {
					this.previousColor = str;
				} else if ( previousColor!=str ) { // Note: case insensitive comparison.
				    let setColorIssue = this.setColorIssue;
					if ( setColorIssue!='ignore' ) {
						let message = 'Expected single color/monotone <svg>, however multiple colors encountered in <svg> - previous color "'
							+ previousColor + '", but just encountered <' + node.name + ' ' + attribName + '="' + attribs[attribName] + '"> attribute with different color';
						if ( !setColorIssue || setColorIssue=='warn' ) {
							console.warn(message);
						} else if ( setColorIssue=='rollback' ) {
							throw Ensure.unexpectedObject(message, node);
						} else {
							throw SvgTranslateError.fail(message);
						}
					}
				}
				attribs[attribName] = setColor;
			}
		}
	}

	#getAttribString(node, attribs, attribName) {
		let str = attribs[attribName];
		if ( typeof str != 'string' ) {
			throw Ensure.unexpectedObject('Invalid <' + node.name + ' ' + attribName + '> attribute - expected string', node);
		} else if ( str.length<=0 ) {
			throw Ensure.unexpectedObject('Invalid <' + node.name + ' ' + attribName + '> attribute - empty string specified for attribute', node);
		}
		return str;
	}

	#getAttribNumber(node, attribs, attribName) {
		let str = this.#getAttribString(node, attribs, attribName);
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

	#path(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#path
		const attribs = node.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='d' ) {
				let data = attribs.d;
				let dataNew = new SVGPathData(data).toAbs().translate(this.x, this.y).round(1e14).encode();
				attribs.d = dataNew;
			} else {
				this.#unhandledAttribute(node, attribs, attribName);
			}
		}
		this.#ensureNoChildren(node);
	}

	#rect(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#rectangle
		const attribs = node.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='x' ) {
				this.#translateX(node, attribs, attribName);
			} else if ( attribName=='y' ) {
				this.#translateY(node, attribs, attribName);
			} else if ( attribName=='width' || attribName=='height' || attribName=='rx' || attribName=='ry' ) {
				// Can safely ignore these
			} else {
				this.#unhandledAttribute(node, attribs, attribName);
			}
		}
		this.#ensureNoChildren(node);
	}

	#line(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#line
		const attribs = node.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='x1' || attribName=='x2' ) {
				this.#translateX(node, attribs, attribName);
			} else if ( attribName=='y1' || attribName=='y2' ) {
				this.#translateY(node, attribs, attribName);
			} else {
				this.#unhandledAttribute(node, attribs, attribName);
			}
		}
		this.#ensureNoChildren(node);
	}

	#polyline(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#polyline
		this.#_silentRollbackIfFirstPass(node);
	}

	#polygon(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#polygon
		this.#_silentRollbackIfFirstPass(node);
	}

	#_silentRollbackIfFirstPass(node) {
		let multipassCount = this.multipassCount;
		if ( multipassCount===0 ) {
			throw SvgTranslateError.silentRollback("Svgo's 'convertShapeToPath' plugin will convert this to <path d> - which we can translate on next call");
		} else {
			throw Ensure.unexpectedObject("Svgo's 'convertShapeToPath' was meant to convert <" + node.name + "> to <path d> on the first pass,"
				+ " however it's multipassCount=" + multipassCount + " and this <" + node.name + "> element hasn't been replaced.\n"
				+ "Please confirm svgo default plugins or at least the 'convertShapeToPath' plugin are in your svgo configuration file.", node);
		}
	}

	#circle(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#circle
		const attribs = node.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='cx' ) {
				this.#translateX(node, attribs, attribName);
			} else if ( attribName=='cy' ) {
				this.#translateY(node, attribs, attribName);
			} else if ( attribName=='r' ) {
				// Can safely ignore these
			} else {
				this.#unhandledAttribute(node, attribs, attribName);
			}
		}
		this.#ensureNoChildren(node);
	}

	#ellipse(node) { // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes#ellipse
		const attribs = node.attributes;
		for ( const attribName in attribs ) {
			if ( attribName=='cx' ) {
				this.#translateX(node, attribs, attribName);
			} else if ( attribName=='cy' ) {
				this.#translateY(node, attribs, attribName);
			} else if ( attribName=='rx' || attribName=='ry' ) {
				// Can safely ignore these
			} else {
				this.#unhandledAttribute(node, attribs, attribName);
			}
		}
		this.#ensureNoChildren(node);
	}

}
