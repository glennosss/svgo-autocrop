
const autocrop = require('./index');

module.exports = {
  multipass: false, // Doesn't matter if this is true or false - autocrop will only be run on the first iteration.
  plugins: [
	{ // Include autocrop plugin
		...autocrop,
		params: {
			debug: true,
			debugWriteFiles: true, // Outputs html/png files. FYI Setting this to true would be an easy way to convert all your SVGs to PNGs.
			debugWorkerThread: true // Warning: have to manually terminate terminate application when this is true.
		}
	}
  ]
};
