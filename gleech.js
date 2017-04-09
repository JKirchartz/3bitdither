/*
 * Gleech.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Extend JIMP with glitches
 *
 * Distributed under terms of the NPL (Necessary Public License) license.
 */
var Jimp = require('jimp');

  /***************************************************
   * Helper Functions
   ***************************************************/

  function adjustPixelError(data, i, error, multiplier) {
    data[i] = data[i] + multiplier * error[0];
    data[i + 1] = data[i + 1] + multiplier * error[1];
    data[i + 2] = data[i + 2] + multiplier * error[2];
  }

  function nullOrUndefined(item) {
    if (typeof item !== 'undefined' || item == null) {
      return true;
    }
    return false;
  }

  // return random # < a
  function randFloor(a) {return Math.floor(Math.random() * a);}
  // return random # <= a
  function randRound(a) {return Math.round(Math.random() * a);}
  // return random # between A & B
  function randRange(a, b) {return Math.round(Math.random() * b) + a;}
  // relatively fair 50/50
  function coinToss() {return Math.random() > 0.5;}
  function randMinMax(min, max) {
    // generate min & max values by picking
    // one 'fairly', then picking another from the remainder
    var randA = Math.round(randRange(min, max));
    var randB = Math.round(randRange(randA, max));
    return [randA, randB];
  }
  function randMinMax2(min, max) {
    // generate min & max values by picking both fairly
    // then returning the lesser value before the greater.
    var randA = Math.round(randRange(min, max));
    var randB = Math.round(randRange(min, max));
    return randA < randB ? [randA, randB] : [randB, randA];
  }
  function randChoice(arr) {
    return arr[randFloor(arr.length)];
  }

  function randChance(percent) {
    // percent is a number 1-100
    return (Math.random() < (percent / 100));
  }

  function sum(o) {
    for (var s = 0, i = o.length; i; s += o[--i]) {}
    return s;
  }
  function leftSort(a, b) {return parseInt(a, 10) - parseInt(b, 10);}
  function rightSort(a, b) {return parseInt(b, 10) - parseInt(a, 10);}
  function blueSort(a, b) {
    var aa = a >> 24 & 0xFF,
      ar = a >> 16 & 0xFF,
      ag = a >> 8 & 0xFF,
      ab = a & 0xFF;
    var ba = b >> 24 & 0xFF,
      br = b >> 16 & 0xFF,
      bg = b >> 8 & 0xFF,
      bb = b & 0xFF;
    return aa - bb;
  }
  function redSort(a, b) {
    var aa = a >> 24 & 0xFF,
      ar = a >> 16 & 0xFF,
      ag = a >> 8 & 0xFF,
      ab = a & 0xFF;
    var ba = b >> 24 & 0xFF,
      br = b >> 16 & 0xFF,
      bg = b >> 8 & 0xFF,
      bb = b & 0xFF;
    return ar - br;
  }
  function greenSort(a, b) {
    var aa = a >> 24 & 0xFF,
      ar = a >> 16 & 0xFF,
      ag = a >> 8 & 0xFF,
      ab = a & 0xFF;
    var ba = b >> 24 & 0xFF,
      br = b >> 16 & 0xFF,
      bg = b >> 8 & 0xFF,
      bb = b & 0xFF;
    return ag - bg;
  }
  function avgSort(a, b) {
    var aa = a >> 24 & 0xFF,
      ar = a >> 16 & 0xFF,
      ag = a >> 8 & 0xFF,
      ab = a & 0xFF;
    var ba = b >> 24 & 0xFF,
      br = b >> 16 & 0xFF,
      bg = b >> 8 & 0xFF,
      bb = b & 0xFF;
    return ((aa + ar + ag + ab) / 4) - ((ba + br + bg + bb) / 4);
  }
  function randSort(a, b) {
    var sort = randChoice([coinToss, leftSort, rightSort, redSort, greenSort,
                          blueSort, avgSort]);
    return sort(a, b);
  }


function isNodePattern(cb) {
  // borrowed from JIMP
      if ("undefined" == typeof cb) return false;
      if ("function" != typeof cb)
            throw new Error("Callback must be a function");
      return true;
}

Jimp.prototype.dither8Bit = function dither8Bit(size, cb) {
        if (!nullOrUndefined(size)) {
          if ("number" != typeof size)
                  return throwError.call(this, "size must be a number", cb);
          if (size < 2)
                  return throwError.call(this, "size must be greater than 1", cb);
        }
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data,
                size = !nullOrUndefined(size) ? size : 4,
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
                                        sum_r += data[i];
                                        sum_g += data[i + 1];
                                        sum_b += data[i + 2];
                                }
                        }
                        avg_r = (sum_r / (size * size)) > 127 ? 0xff : 0;
                        avg_g = (sum_g / (size * size)) > 127 ? 0xff : 0;
                        avg_b = (sum_b / (size * size)) > 127 ? 0xff : 0;
                        for (s_y = 0; s_y < size; s_y++) {
                                for (s_x = 0; s_x < size; s_x++) {
                                        i = 4 * (width * (y + s_y) + (x + s_x));
                                        data[i] = avg_r;
                                        data[i + 1] = avg_g;
                                        data[i + 2] = avg_b;
                                }
                        }
                }
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.ditherHalftone = function ditherHalftone(cb) {
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data;
        for (var y = 0; y <= height - 2; y += 3) {
                for (var x = 0; x <= width - 2; x += 3) {
                        var sum_r = 0, sum_g = 0, sum_b = 0;
                        var indexed = [];
                        var count = 0;
                        for (var s_y = 0; s_y < 3; s_y++) {
                                for (var s_x = 0; s_x < 3; s_x++) {
                                        var i = 4 * (width * (y + s_y) + (x + s_x));
                                        sum_r += data[i];
                                        sum_g += data[i + 1];
                                        sum_b += data[i + 2];
                                        data[i] = data[i + 1] = data[i + 2] = 0xff;
                                        indexed.push(i);
                                        count++;
                                }
                        }
                        var avg_r = (sum_r / 9) > 127 ? 0xff : 0;
                        var avg_g = (sum_g / 9) > 127 ? 0xff : 0;
                        var avg_b = (sum_b / 9) > 127 ? 0xff : 0;
                        var avg_lum = (avg_r + avg_g + avg_b) / 3;
                        var scaled = Math.round((avg_lum * 9) / 255);
                        if (scaled < 9) {
                                data[indexed[4]] = avg_r;
                                data[indexed[4] + 1] = avg_g;
                                data[indexed[4] + 2] = avg_b;
                        }
                        if (scaled < 8) {
                                data[indexed[5]] = avg_r;
                                data[indexed[5] + 1] = avg_g;
                                data[indexed[5] + 2] = avg_b;
                        }
                        if (scaled < 7) {
                                data[indexed[1]] = avg_r;
                                data[indexed[1] + 1] = avg_g;
                                data[indexed[1] + 2] = avg_b;
                        }
                        if (scaled < 6) {
                                data[indexed[6]] = avg_r;
                                data[indexed[6] + 1] = avg_g;
                                data[indexed[6] + 2] = avg_b;
                        }
                        if (scaled < 5) {
                                data[indexed[3]] = avg_r;
                                data[indexed[3] + 1] = avg_g;
                                data[indexed[3] + 2] = avg_b;
                        }
                        if (scaled < 4) {
                                data[indexed[8]] = avg_r;
                                data[indexed[8] + 1] = avg_g;
                                data[indexed[8] + 2] = avg_b;
                        }
                        if (scaled < 3) {
                                data[indexed[2]] = avg_r;
                                data[indexed[2] + 1] = avg_g;
                                data[indexed[2] + 2] = avg_b;
                        }
                        if (scaled < 2) {
                                data[indexed[0]] = avg_r;
                                data[indexed[0] + 1] = avg_g;
                                data[indexed[0] + 2] = avg_b;
                        }
                        if (scaled < 1) {
                                data[indexed[7]] = avg_r;
                                data[indexed[7] + 1] = avg_g;
                                data[indexed[7] + 2] = avg_b;
                        }
                }
        }

        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.ditherAtkinsons = function ditherAtkinsons(cb) {
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data;
        for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                        var i = 4 * (y * width + x);
                        var old_r = data[i];
                        var old_g = data[i + 1];
                        var old_b = data[i + 2];
                        var new_r = (old_r > 127) ? 0xff : 0;
                        var new_g = (old_g > 127) ? 0xff : 0;
                        var new_b = (old_b > 127) ? 0xff : 0;
                        data[i] = new_r;
                        data[i + 1] = new_g;
                        data[i + 2] = new_b;
                        var err_r = old_r - new_r;
                        var err_g = old_g - new_g;
                        var err_b = old_b - new_b;
                        // Redistribute the pixel's error like this:
                        //       *  1/8 1/8
                        //  1/8 1/8 1/8
                        //      1/8
                        // The ones to the right...
                        var adj_i = 0;
                        if (x < width - 1) {
                                adj_i = i + 4;
                                adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
                                // The pixel that's down and to the right
                                if (y < height - 1) {
                                        adj_i = adj_i + (width * 4) + 4;
                                        adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
                                }
                                // The pixel two over
                                if (x < width - 2) {
                                        adj_i = i + 8;
                                        adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
                                }
                        }
                        if (y < height - 1) {
                                // The one right below
                                adj_i = i + (width * 4);
                                adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
                                if (x > 0) {
                                        // The one to the left
                                        adj_i = adj_i - 4;
                                        adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
                                }
                                if (y < height - 2) {
                                        // The one two down
                                        adj_i = i + (2 * width * 4);
                                        adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
                                }
                        }
                }
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.ditherFloydSteinberg = function ditherFloydSteinberg(cb) {
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data;
        for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                        var i = 4 * (y * width + x);
                        var old_r = data[i];
                        var old_g = data[i + 1];
                        var old_b = data[i + 2];
                        var new_r = (old_r > 127) ? 0xff : 0;
                        var new_g = (old_g > 127) ? 0xff : 0;
                        var new_b = (old_b > 127) ? 0xff : 0;
                        data[i] = new_r;
                        data[i + 1] = new_g;
                        data[i + 2] = new_b;
                        var err_r = old_r - new_r;
                        var err_g = old_g - new_g;
                        var err_b = old_b - new_b;
                        // Redistribute the pixel's error like this:
                        //   * 7
                        // 3 5 1
                        // The ones to the right...
                        var right_i = 0, down_i = 0, left_i = 0, next_right_i = 0;
                        if (x < width - 1) {
                                right_i = i + 4;
                                adjustPixelError(data, right_i, [err_r, err_g, err_b], 7 / 16);
                                // The pixel that's down and to the right
                                if (y < height - 1) {
                                        next_right_i = right_i + (width * 4);
                                        adjustPixelError(data, next_right_i, [err_r, err_g, err_b],
                                                1 / 16);
                                }
                        }
                        if (y < height - 1) {
                                // The one right below
                                down_i = i + (width * 4);
                                adjustPixelError(data, down_i, [err_r, err_g, err_b], 5 / 16);
                                if (x > 0) {
                                        // The one down and to the left...
                                        left_i = down_i - 4;
                                        adjustPixelError(data, left_i, [err_r, err_g, err_b], 3 /
                                                16);
                                }
                        }
                }
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.ditherBayer = function ditherBayer(map, cb) {
        if (!nullOrUndefined(map)) {
          if ("number" != typeof map)
                  return throwError.call(this, "map must be a number", cb);
          if (map < 0 || map > 2)
                  return throwError.call(this, "map must be a number from 0 to 2", cb);
        }
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data,
                /* added more threshold maps and the randomizer, the rest is stock */
                threshold_maps = [
                        [
                                [3, 7, 4],
                                [6, 1, 9],
                                [2, 8, 5]
                        ],
                        [
                                [1, 9, 3, 11],
                                [13, 5, 15, 7],
                                [4, 12, 2, 10],
                                [16, 8, 14, 6]
                        ],
                        [
                                [1, 49, 13, 61, 4, 52, 16, 64],
                                [33, 17, 45, 29, 36, 20, 48, 32],
                                [9, 57, 5, 53, 12, 60, 8, 56],
                                [41, 25, 37, 21, 44, 28, 40, 24],
                                [3, 51, 15, 63, 2, 50, 14, 62],
                                [35, 19, 47, 31, 34, 18, 46, 30],
                                [11, 59, 7, 55, 10, 58, 6, 54],
                                [43, 27, 39, 23, 42, 26, 38, 22]
                        ]
                ],
                threshold_map = !nullOrUndefined(map) ? threshold_maps[map] : threshold_maps[randFloor(threshold_maps.length)],
                size = threshold_map.length;
        for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                        var i = 4 * (y * width + x);
                        var gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
                        var scaled = (gray * 17) / 255;
                        var val = scaled < threshold_map[x % size][y % size] ? 0 : 0xff;
                        data[i] = data[i + 1] = data[i + 2] = val;
                }
        }

        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.ditherBayer3 = function ditherBayer3(map, cb) {
        if (!nullOrUndefined(map)) {
          if ("number" != typeof map)
                  return throwError.call(this, "map must be a number", cb);
          if (map < 0 || map > 2)
                  return throwError.call(this, "map must be a number from 0 to 2", cb);
        }
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data,
                /* adding in more threshold maps, and the randomizer */
                threshold_maps = [
                        [
                                [3, 7, 4],
                                [6, 1, 9],
                                [2, 8, 5]
                        ],
                        [
                                [1, 9, 3, 11],
                                [13, 5, 15, 7],
                                [4, 12, 2, 10],
                                [16, 8, 14, 6]
                        ],
                        [
                                [1, 49, 13, 61, 4, 52, 16, 64],
                                [33, 17, 45, 29, 36, 20, 48, 32],
                                [9, 57, 5, 53, 12, 60, 8, 56],
                                [41, 25, 37, 21, 44, 28, 40, 24],
                                [3, 51, 15, 63, 2, 50, 14, 62],
                                [35, 19, 47, 31, 34, 18, 46, 30],
                                [11, 59, 7, 55, 10, 58, 6, 54],
                                [43, 27, 39, 23, 42, 26, 38, 22]
                        ]
                ],
                threshold_map = !nullOrUndefined(map) ? threshold_maps[map] : threshold_maps[randFloor(threshold_maps.length)],
                size = threshold_map.length;
        for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                        var i = 4 * (y * width + x);
                        /* apply the tranformation to each color */
                        data[i] = ((data[i] * 17) / 255) < threshold_map[x % size][y %
                                size] ? 0 : 0xff;
                        data[i + 1] = ((data[i + 1] * 17) / 255) < threshold_map[x %
                                size][y % size] ? 0 : 0xff;
                        data[i + 2] = ((data[i + 2] * 17) / 255) < threshold_map[x %
                                size][y % size] ? 0 : 0xff;
                }
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.ditherRandom = function ditherRandom(cb) {
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data;
        for (var i = 0, val, scaled, size = width * height * 4; i < size; i += 4) {
                scaled = ((data[i] + data[i + 1] + data[i + 2]) / 3) % 255;
                val = scaled < randRound(128) ? 0 : 0xff;
                data[i] = data[i + 1] = data[i + 2] = val;
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;

};

Jimp.prototype.ditherRandom3 = function ditherRandom3(cb) {
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data;
        for (var i = 0, size = width * height * 4; i < size; i += 4) {
                data[i] = data[i] < randRound(128) ? 0 : 0xff;
                data[i + 1] = data[i + 1] < randRound(128) ? 0 : 0xff;
                data[i + 2] = data[i + 2] < randRound(128) ? 0 : 0xff;
        }

        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.ditherBitmask = function ditherBitmask(mask, cb) {
        if (!nullOrUndefined(mask)) {
          if ("number" != typeof mask)
                  return throwError.call(this, "map must be a number", cb);
          if (mask < 0 || mask > 254)
                  return throwError.call(this, "map must be a number from 0 to 2", cb);
        }
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data,
                M = !nullOrUndefined(mask) ? mask : randRange(1, 125);
        // 0xc0; 2 bits
        // 0xe0  3 bits
        // 0xf0  4 bits
        for (var i = 0, size = width * height * 4; i < size; i += 4) {
                // data[i] |= M;
                // data[i + 1] |= M;
                // data[i + 2] |= M;
                data[i] |= M;
                data[i + 1] |= M;
                data[i + 2] |= M;
        }

        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

/* jimp snippet

Jimp.prototype.functionName = function functionName() {
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data;
        // your code here
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

  gleech.superShift = function superShift(imageData) {
    for (var i = 0, l = randRange(1, 10); i < l; i++) {
      imageData = gleech.colorShift(imageData);
    }
    return imageData;
  };
*/

// todo: rewrite colorShift functions to match Jimp.prototype.sepia
Jimp.prototype.colorShift = function colorShift(dir, cb) {
        if (!nullOrUndefined(dir))
                return throwError.call(this, "dir must be truthy or falsey", cb);
        var width = this.bitmap.width,
            height = this.bitmap.height,
            data = this.bitmap.data,
            dir = !nullOrUndefined(dir) ? dir : coinToss();
        for (var i = 0, size = width * height * 4; i < size; i += 4) {
          var r = data[i],
              g = data[i + 1],
              b = data[i + 2];
          data[i] = dir ? g : b;
          data[i + 1] = dir ? b : r;
          data[i + 2] = dir ? r : g;
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.colorShift2 = function colorShift2(dir, cb) {
        if (!nullOrUndefined(dir))
                return throwError.call(this, "dir must be truthy or falsey", cb);
        var width = this.bitmap.width,
            height = this.bitmap.height,
            data = this.bitmap.data,
            dir = !nullOrUndefined(dir) ? dir : coinToss();
        for (var i = 0, size = data.length; i < size; i++) {
          var a = data[i] >> 24 & 0xFF,
              r = data[i] >> 16 & 0xFF,
              g = data[i] >> 8 & 0xFF,
              b = data[i] & 0xFF;
          r = (dir ? g : b) & 0xFF;
          g = (dir ? b : r) & 0xFF;
          b = (dir ? r : g) & 0xFF;
          data[i] = (a << 24) + (r << 16) + (g << 8) + (b);
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};


Jimp.prototype.greenShift = function greenShift(factor, cb) {
        if (!nullOrUndefined(factor)) {
          if ("number" != typeof factor)
                  return throwError.call(this, "factor must be a number", cb);
          if (factor < 2)
                  return throwError.call(this, "factor must be greater than 1", cb);
        }
        var width = this.bitmap.width,
            height = this.bitmap.height,
            data = this.bitmap.data,
            factor = !nullOrUndefined(factor) ? factor : randFloor(64);
        for (var i = 0, size = width * height * 4; i < size; i += 4) {
          var shift = data[i + 1] + factor;
          data[i] -= factor;
          data[i + 1] = (shift) > 255 ? 255 : shift;
          data[i + 2] -= factor;
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.redShift = function redShift(factor, cb) {
        if (!nullOrUndefined(factor)) {
          if ("number" != typeof factor)
                  return throwError.call(this, "factor must be a number", cb);
          if (factor < 2)
                  return throwError.call(this, "factor must be greater than 1", cb);
        }
        var width = this.bitmap.width,
            height = this.bitmap.height,
            data = this.bitmap.data,
            factor = !nullOrUndefined(factor) ? factor : randFloor(64);
        for (var i = 0, size = width * height * 4; i < size; i += 4) {
          var shift = data[i + 1] + factor;
          data[i] = (shift) > 255 ? 255 : shift;
          data[i + 1] -= factor;
          data[i + 2] -= factor;
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};

Jimp.prototype.blueShift = function blueShift(factor, cb) {
        if (!nullOrUndefined(factor)) {
          if ("number" != typeof factor)
                  return throwError.call(this, "factor must be a number", cb);
          if (factor < 2)
                  return throwError.call(this, "factor must be greater than 1", cb);
        }
        var width = this.bitmap.width,
            height = this.bitmap.height,
            data = this.bitmap.data,
            factor = !nullOrUndefined(factor) ? factor : randFloor(64);
        for (var i = 0, size = width * height * 4; i < size; i += 4) {
          var shift = data[i + 1] + factor;
          data[i] -= factor;
          data[i + 1] -= factor;
          data[i + 2] = (shift) > 255 ? 255 : shift;
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};


Jimp.prototype.superShift = function superShift(iter, dir, cb) {
        if (!nullOrUndefined(iter)) {
          if ("number" != typeof factor)
                  return throwError.call(this, "factor must be a number", cb);
          if (factor < 2)
                  return throwError.call(this, "factor must be greater than 1", cb);
        }
        if (!nullOrUndefined(dir))
                return throwError.call(this, "dir must be truthy or falsey", cb);
        var width = this.bitmap.width,
            height = this.bitmap.height,
            data = this.bitmap.data,
            dir = !nullOrUndefined(dir) ? dir : coinToss(),
            iter = !nullOrUndefined(iter) ? iter : randRange(1, 10);
        for (var i = 0, l = iter; i < l; i++) {
          for (var i = 0, size = width * height * 4; i < size; i += 4) {
            var r = data[i],
                g = data[i + 1],
                b = data[i + 2];
            data[i] = dir ? g : b;
            data[i + 1] = dir ? b : r;
            data[i + 2] = dir ? r : g;
          }
        }
        this.bitmap.data = new Buffer(data);
        if (isNodePattern(cb)) return cb.call(this, null, this);
        else return this;
};


module.exports = Jimp;
