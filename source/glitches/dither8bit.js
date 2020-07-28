import { isNodePattern, throwError } from "@jimp/utils";
import { nullOrUndefined, randRange } from "../helpers.js";

export default () => ({
  /**
   * Dither: 8 bits
   * @param {number} size - a number greater than 1 representing pixel size.
   * @param {function(Error, Jimp)} cb (optional) a callback for when complete
   * @returns {Jimp} this for chaining of methods
   */
  dither8Bit(size, cb) {
    size = nullOrUndefined(size) ? randRange(4, 15) : size;
    if (typeof size !== "number") {
      return throwError.call(this, "size must be a number " + size, cb);
    }
    if (size < 2) {
      return throwError.call(this, "size must be greater than 1", cb);
    }

    var width = this.bitmap.width,
      height = this.bitmap.height,
      sum_r, sum_g, sum_b, avg_r, avg_g, avg_b;

    for (var y = 0; y < height; y += size) {
      for (var x = 0; x < width; x += size) {
        sum_r = 0;
        sum_g = 0;
        sum_b = 0;
        var s_y, s_x, i;
        for (s_y = 0; s_y < size; s_y++) {
          for (s_x = 0; s_x < size; s_x++) {
            i = 4 * (width * (y + s_y) + (x + s_x));
            sum_r += this.bitmap.data[i];
            sum_g += this.bitmap.data[i + 1];
            sum_b += this.bitmap.data[i + 2];
          }
        }
        avg_r = (sum_r / (size * size)) > 127 ? 0xff : 0;
        avg_g = (sum_g / (size * size)) > 127 ? 0xff : 0;
        avg_b = (sum_b / (size * size)) > 127 ? 0xff : 0;
        for (s_y = 0; s_y < size; s_y++) {
          for (s_x = 0; s_x < size; s_x++) {
            i = 4 * (width * (y + s_y) + (x + s_x));
            this.bitmap.data[i] = avg_r;
            this.bitmap.data[i + 1] = avg_g;
            this.bitmap.data[i + 2] = avg_b;
          }
        }
      }
    }
    if (isNodePattern(cb)) return cb.call(this, null, this);
    else return this;
  }
});

