import { isNodePattern, throwError } from "@jimp/utils";
import {nullOrUndefined, randFloor } from "../helpers.js";

/**
 * Blue Shift
 * @param {number} factor - factor by which to reduce red and green channels and boost blue channel
 * @param {function(Error, Jimp)} cb (optional) a callback for when complete
 * @returns {Jimp} this for chaining of methods
 */

export default () => ({
  blueShift (factor, cb) {
    if (!nullOrUndefined(factor)) {
      if ("number" != typeof factor)
        return throwError.call(this, "factor must be a number", cb);
      if (factor < 2)
        return throwError.call(this, "factor must be greater than 1", cb);
    }
    const width = this.bitmap.width;
    const height = this.bitmap.height;
    factor = !nullOrUndefined(factor) ? factor : randFloor(64);
    this.scanQuiet(0, 0, width, height, function(x,y,i) {
      var shift = this.bitmap.data[i + 2] + factor;
      this.bitmap.data[i] -= factor;
      this.bitmap.data[i + 1] -= factor;
      this.bitmap.data[i + 2] = (shift) > 255 ? 255 : shift;
    });
    if (isNodePattern(cb)) return cb.call(this, null, this);
    else return this;
  }
});

