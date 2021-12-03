
const autocrop = require('./index');

module.exports = {
  multipass: false, // Doesn't matter if this is true or false - autocrop will only be run on the first iteration.
  plugins: [
	{ // Include autocrop plugin
		...autocrop
	}
  ]
};
