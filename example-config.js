
const autocrop = require('svgo-autocrop');

/**
 * The below configuration is for monotone (i.e. single color) svgs. Any colour will be replaced with 'currentColor' so the color is inherited from the html/css.
 *
 * If your svgs contain multiple colours, then remove the 'setColor'/'setColorIssue' attributes.
 */

module.exports = {
  multipass: true, // Keep running optimisations until doesn't optimise anymore.
  plugins: [
    { // Include default optimisations
      name: 'preset-default',
      params: {
        overrides: {
		  // Disable "remove 'viewBox'" plugin.
          removeViewBox: false, // https://github.com/svg/svgo/blob/master/plugins/removeViewBox.js
        },
      },
    },

	// Remove width/height attributes and add the viewBox attribute if it's missing. Highly recommended so the <svg> scales!
	'removeDimensions', // https://github.com/svg/svgo/blob/master/plugins/removeDimensions.js

	// Sort attributes - helps with readability/compression.
	'sortAttrs', // https://github.com/svg/svgo/blob/master/plugins/sortAttrs.js

	// Keep styles consistent
	'convertStyleToAttrs', // https://github.com/svg/svgo/blob/master/plugins/convertStyleToAttrs.js

	// Remove <style> if present in svg
	'removeStyleElement', // https://github.com/svg/svgo/blob/master/plugins/removeStyleElement.js

	// Remove <script> if present in svg
	'removeScriptElement', // https://github.com/svg/svgo/blob/master/plugins/removeScriptElement.js

	{ // Run autocrop last (you'll get less issues if autocrop runs after the svgo's default 'convertTransform' and 'convertShapeToPath' plugins)
		...autocrop,
		params: {
			autocrop: true,
			includeWidthAndHeightAttributes: false, // Same as enabling 'removeDimensions' plugin (and disabling 'removeViewBox' plugin).

			removeClass: true, // Remove 'class' attribute if encountered.
			removeStyle: true, // Remove 'style'/'font-family' attribute if encountered.
			removeDeprecated: true, // Remove deprecated attributes - like <svg version/baseProfile>/etc.

			setColor: 'currentColor', // Replace any colors encountered with 'currentColor'.
			setColorIssue: 'fail' // Fail if more than one color encountered.
		}
	},
  ]
};
