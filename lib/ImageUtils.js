
const Ensure = require('./Ensure');

const Jimp = Ensure.clazz(require('jimp'));

module.exports = class ImageUtils {

	/**
	 * Loads image and returns width/height and bounds of visible pixels.
	 *
	 * @return Returns {width, height, xMin, yMin, xMax, yMax}
	 */
	static async getBounds(imageBytes) {
		if ( !imageBytes ) {
			throw new Error("Expected image bytes to determine bounds of");
		}
		let image = await Jimp.read(imageBytes);
		let width = image.bitmap.width;
		let height = image.bitmap.height;
		if ( width<0 || height<0 ) {
			throw new Error('Invalid image dimensions; width=' + width + ', height=' + height);
		}

		// Scan image determining bounds of visible pixels
		//  Documentation: https://github.com/oliver-moran/jimp/tree/master/packages/jimp#low-level-manipulation
		let xMin, xMax, yMin, yMax;
		image.scan(0, 0, width, height, function(x, y, idx) {
			// If visible pixel
			let alpha = this.bitmap.data[idx + 3];
			if ( alpha>0 ) {
				// Avoid truthy issues (i.e. (!!0)===false) by incrementing x/y by 1.
				x++;
				y++;

				if ( !xMin ) { // Set all coordinates for first visible pixel
					xMin = xMax = x;
					yMin = yMax = y;
				} else {
					if ( x<xMin ) {
						xMin = x;
					} else if ( x>xMax ) {
						xMax = x;
					}

					if ( y<yMin ) {
						yMin = y;
					} else if ( y>yMax ) {
						yMax = y;
					}
				}
			}
		});
		if ( !xMin ) {
			throw new Error('Image has no visible pixels');
		}
		xMin--;
		yMin--;
		xMax--;
		yMax--;

		// Return result
		let result = {width:width, height:height, xMin:xMin, yMin:yMin, xMax:xMax, yMax:yMax};
		if (!( 0<=xMin && xMin<=xMax && xMax<width && 0<=yMin && yMin<=yMax && yMax<height )) {
			throw new Error('Unexpected - invalid bounds calculated: ' + JSON.stringify(result));
		}
		return result;
	}

}
