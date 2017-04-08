/*
 * Gleech.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Extend JIMP with glitches
 *
 * Distributed under terms of the NPL (Necessary Public License) license.
 */
var Jimp = require('jimp');

function isNodePattern(cb) {
      if ("undefined" == typeof cb) return false;
      if ("function" != typeof cb)
            throw new Error("Callback must be a function");
      return true;
}

Jimp.prototype.dither8Bit = function dither8Bit(size, cb) {
        if ("number" != typeof size)
                return throwError.call(this, "size must be a number", cb);
        if (size < 2)
                return throwError.call(this, "size must be greater than 1", cb);
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data,
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

Jimp.prototype.ditherHalftone = function ditherHalftone() {
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

Jimp.prototype.ditherAtkinsons = function ditherAtkinsons() {
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

Jimp.prototype.ditherFloydSteinberg = function ditherFloydSteinberg() {
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

Jimp.prototype.ditherBayer = function ditherBayer() {
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
                threshold_map = threshold_maps[randFloor(threshold_maps.length)],
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

Jimp.prototype.ditherBayer3 = function ditherBayer3() {
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
                threshold_map = threshold_maps[randFloor(threshold_maps.length)],
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

Jimp.prototype.ditherRandom = function ditherRandom() {
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

Jimp.prototype.ditherRandom3 = function ditherRandom3() {
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

Jimp.prototype.ditherBitmask = function ditherBitmask() {
        var width = this.bitmap.width,
                height = this.bitmap.height,
                data = this.bitmap.data,
                M = randRange(1, 125);
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

module.exports = Jimp;
