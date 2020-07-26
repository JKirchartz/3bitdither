import { isNodePattern, throwError } from "@jimp/utils";
import { nullOrUndefined, coinToss } from "../helpers.js";

/**
 * colorShift2
 * @param {boolean} dir - direction to shift pixels (left or right)
 */
export default () => ({
  colorShift2 (dir, cb) {
    if (!nullOrUndefined(dir))
      return throwError.call(this, "dir must be truthy or falsey", cb);
    var width = this.bitmap.width,
      height = this.bitmap.height;
    dir = !nullOrUndefined(dir) ? dir : coinToss();
    this.scanQuiet(0, 0, width, height, function(x,y,i) {
      var a = this.bitmap.data[i] >> 24 & 0xFF,
        r = this.bitmap.data[i] >> 16 & 0xFF,
        g = this.bitmap.data[i] >> 8 & 0xFF,
        b = this.bitmap.data[i] & 0xFF;
      r = (dir ? g : b) & 0xFF;
      g = (dir ? b : r) & 0xFF;
      b = (dir ? r : g) & 0xFF;
      this.bitmap.data[i] = (a << 24) + (r << 16) + (g << 8) + (b);
    });
    if (isNodePattern(cb)) return cb.call(this, null, this);
    else return this;
  }
});
