
const autocrop = require('svgo-autocrop');

module.exports = {
  multipass: true, // Keep running optimisations until doesn't optimise anymore.
  plugins: [
	{ // Run autocrop first
		...autocrop,
		params: {
			includeWidthAndHeightAttributes: false // Same as enabling 'removeDimensions' plugin below.
		}
	},

    { // Include default optimisations
      name: 'preset-default',
      params: {
        overrides: {
		  // Disable "remove 'viewBox'" plugin.
          removeViewBox: false, // https://github.com/svg/svgo/blob/master/plugins/removeViewBox.js
        },
      },
    },

	// Remove width/height attributes and add the viewBox attribute if it's missing
	'removeDimensions', // https://github.com/svg/svgo/blob/master/plugins/removeDimensions.js

	// Sort attributes - helps with readability/compression.
	'sortAttrs', // https://github.com/svg/svgo/blob/master/plugins/sortAttrs.js
  ]
};
