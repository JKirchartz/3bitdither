/*
 * gleech.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Distributed under terms of the NPL (Necessary Public License) license.
 */
var Jimp = require('jimp');

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
