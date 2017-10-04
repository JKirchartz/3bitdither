/*
 * Gleech.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Extend JIMP with glitches
 *
 * Distributed under terms of the GPL 3.0 (General Public License) license.
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
	if (typeof item !== 'undefined' || item === null) {
		return true;
	}
	return false;
}

// return random # < a
function randFloor(a) {
	return Math.floor(Math.random() * a);
}
// return random # <= a
function randRound(a) {
	return Math.round(Math.random() * a);
}
// return random # between A & B
function randRange(a, b) {
	return Math.round(Math.random() * b) + a;
}
// relatively fair 50/50
function coinToss() {
	return Math.random() > 0.5;
}
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
	return Math.random() < percent / 100;
}

function sum(o) {
	for (var s = 0, i = o.length; i; s += o[--i]) {}
	return s;
}
function leftSort(a, b) {
	return parseInt(a, 10) - parseInt(b, 10);
}
function rightSort(a, b) {
	return parseInt(b, 10) - parseInt(a, 10);
}
function blueSort(a, b) {
	var aa = (a >> 24) & 0xff,
		ar = (a >> 16) & 0xff,
		ag = (a >> 8) & 0xff,
		ab = a & 0xff;
	var ba = (b >> 24) & 0xff,
		br = (b >> 16) & 0xff,
		bg = (b >> 8) & 0xff,
		bb = b & 0xff;
	return aa - bb;
}
function redSort(a, b) {
	var aa = (a >> 24) & 0xff,
		ar = (a >> 16) & 0xff,
		ag = (a >> 8) & 0xff,
		ab = a & 0xff;
	var ba = (b >> 24) & 0xff,
		br = (b >> 16) & 0xff,
		bg = (b >> 8) & 0xff,
		bb = b & 0xff;
	return ar - br;
}
function greenSort(a, b) {
	var aa = (a >> 24) & 0xff,
		ar = (a >> 16) & 0xff,
		ag = (a >> 8) & 0xff,
		ab = a & 0xff;
	var ba = (b >> 24) & 0xff,
		br = (b >> 16) & 0xff,
		bg = (b >> 8) & 0xff,
		bb = b & 0xff;
	return ag - bg;
}
function avgSort(a, b) {
	var aa = (a >> 24) & 0xff,
		ar = (a >> 16) & 0xff,
		ag = (a >> 8) & 0xff,
		ab = a & 0xff;
	var ba = (b >> 24) & 0xff,
		br = (b >> 16) & 0xff,
		bg = (b >> 8) & 0xff,
		bb = b & 0xff;
	return (aa + ar + ag + ab) / 4 - (ba + br + bg + bb) / 4;
}
function randSort(a, b) {
	var sort = randChoice([
		coinToss,
		leftSort,
		rightSort,
		redSort,
		greenSort,
		blueSort,
		avgSort
	]);
	return sort(a, b);
}

function isNodePattern(cb) {
	// borrowed from JIMP
	if ('undefined' == typeof cb) return false;
	if ('function' != typeof cb) throw new Error('Callback must be a function');
	return true;
}

/**
 * Dither: 8 bits
 * @param {number} size - a number greater than 1 representing pixel size.
 */
Jimp.prototype.dither8Bit = function dither8Bit(size, cb) {
	if (!nullOrUndefined(size)) {
		if ('number' != typeof size)
			return throwError.call(this, 'size must be a number', cb);
		if (size < 2)
			return throwError.call(this, 'size must be greater than 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data,
		sum_r,
		sum_g,
		sum_b,
		avg_r,
		avg_g,
		avg_b;
	size = !nullOrUndefined(size) ? size : 4;

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
			avg_r = sum_r / (size * size) > 127 ? 0xff : 0;
			avg_g = sum_g / (size * size) > 127 ? 0xff : 0;
			avg_b = sum_b / (size * size) > 127 ? 0xff : 0;
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

/**
 * Dither: Halftone
 */
Jimp.prototype.ditherHalftone = function ditherHalftone(cb) {
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
	for (var y = 0; y <= height - 2; y += 3) {
		for (var x = 0; x <= width - 2; x += 3) {
			var sum_r = 0,
				sum_g = 0,
				sum_b = 0;
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
			var avg_r = sum_r / 9 > 127 ? 0xff : 0;
			var avg_g = sum_g / 9 > 127 ? 0xff : 0;
			var avg_b = sum_b / 9 > 127 ? 0xff : 0;
			var avg_lum = (avg_r + avg_g + avg_b) / 3;
			var scaled = Math.round(avg_lum * 9 / 255);
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

/**
 * Dither: Atkinsons
 */
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
			var new_r = old_r > 127 ? 0xff : 0;
			var new_g = old_g > 127 ? 0xff : 0;
			var new_b = old_b > 127 ? 0xff : 0;
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
					adj_i = adj_i + width * 4 + 4;
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
				adj_i = i + width * 4;
				adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
				if (x > 0) {
					// The one to the left
					adj_i = adj_i - 4;
					adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
				}
				if (y < height - 2) {
					// The one two down
					adj_i = i + 2 * width * 4;
					adjustPixelError(data, adj_i, [err_r, err_g, err_b], 1 / 8);
				}
			}
		}
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Dither: Floyd-Steinberg
 */
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
			var new_r = old_r > 127 ? 0xff : 0;
			var new_g = old_g > 127 ? 0xff : 0;
			var new_b = old_b > 127 ? 0xff : 0;
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
			var right_i = 0,
				down_i = 0,
				left_i = 0,
				next_right_i = 0;
			if (x < width - 1) {
				right_i = i + 4;
				adjustPixelError(data, right_i, [err_r, err_g, err_b], 7 / 16);
				// The pixel that's down and to the right
				if (y < height - 1) {
					next_right_i = right_i + width * 4;
					adjustPixelError(data, next_right_i, [err_r, err_g, err_b], 1 / 16);
				}
			}
			if (y < height - 1) {
				// The one right below
				down_i = i + width * 4;
				adjustPixelError(data, down_i, [err_r, err_g, err_b], 5 / 16);
				if (x > 0) {
					// The one down and to the left...
					left_i = down_i - 4;
					adjustPixelError(data, left_i, [err_r, err_g, err_b], 3 / 16);
				}
			}
		}
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Dither: Bayer
 * @param {number} map - which matrix to use for the threshold map - 0: 3x3,  1: 4x4, 2: 8x8
 */
Jimp.prototype.ditherBayer = function ditherBayer(map, cb) {
	if (!nullOrUndefined(map)) {
		if ('number' != typeof map)
			return throwError.call(this, 'map must be a number', cb);
		if (map < 0 || map > 2)
			return throwError.call(this, 'map must be a number from 0 to 2', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data,
		/* added more threshold maps and the randomizer, the rest is stock */
		threshold_maps = [
			[[3, 7, 4], [6, 1, 9], [2, 8, 5]],
			[[1, 9, 3, 11], [13, 5, 15, 7], [4, 12, 2, 10], [16, 8, 14, 6]],
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
		threshold_map = !nullOrUndefined(map)
			? threshold_maps[map]
			: threshold_maps[randFloor(threshold_maps.length)],
		size = threshold_map.length;
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var i = 4 * (y * width + x);
			var gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
			var scaled = gray * 17 / 255;
			var val = scaled < threshold_map[x % size][y % size] ? 0 : 0xff;
			data[i] = data[i + 1] = data[i + 2] = val;
		}
	}

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Dither: Bayer 3 - full-color bayer algo
 * @param {number} map - which matrix to use for the threshold map - 0: 3x3,  1: 4x4, 2: 8x8
 */
Jimp.prototype.ditherBayer3 = function ditherBayer3(map, cb) {
	if (!nullOrUndefined(map)) {
		if ('number' != typeof map)
			return throwError.call(this, 'map must be a number', cb);
		if (map < 0 || map > 2)
			return throwError.call(this, 'map must be a number from 0 to 2', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data,
		/* adding in more threshold maps, and the randomizer */
		threshold_maps = [
			[[3, 7, 4], [6, 1, 9], [2, 8, 5]],
			[[1, 9, 3, 11], [13, 5, 15, 7], [4, 12, 2, 10], [16, 8, 14, 6]],
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
		threshold_map = !nullOrUndefined(map)
			? threshold_maps[map]
			: threshold_maps[randFloor(threshold_maps.length)],
		size = threshold_map.length;
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var i = 4 * (y * width + x);
			/* apply the tranformation to each color */
			data[i] =
				data[i] * 17 / 255 < threshold_map[x % size][y % size] ? 0 : 0xff;
			data[i + 1] =
				data[i + 1] * 17 / 255 < threshold_map[x % size][y % size] ? 0 : 0xff;
			data[i + 2] =
				data[i + 2] * 17 / 255 < threshold_map[x % size][y % size] ? 0 : 0xff;
		}
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Dither: Random - dither according to noise
 */
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

/**
 * Dither: Random 3 - full color dithering via noise
 */
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

/**
 * Dither: Bitmask
 * @param {number} mask - number with which to mask each color channel 1-254
 */
Jimp.prototype.ditherBitmask = function ditherBitmask(mask, cb) {
	if (!nullOrUndefined(mask)) {
		if ('number' != typeof mask)
			return throwError.call(this, 'mask must be a number', cb);
		if (mask < 0 || mask > 254)
			return throwError.call(this, 'mask must be a number from 0 to 2', cb);
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

/**
 * Color Shift
 * @param {boolean} dir - direction to shift colors, true for RGB->GBR, false for RGB->BRG.
 */
Jimp.prototype.colorShift = function colorShift(dir, cb) {
	if (!nullOrUndefined(dir))
		return throwError.call(this, 'dir must be truthy or falsey', cb);
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
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

/*
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
	 */

/**
 * Green Shift
 * @param {number} factor - factor by which to reduce red and blue channels and boost green channel
 */
Jimp.prototype.greenShift = function greenShift(factor, cb) {
	if (!nullOrUndefined(factor)) {
		if ('number' != typeof factor)
			return throwError.call(this, 'factor must be a number', cb);
		if (factor < 2)
			return throwError.call(this, 'factor must be greater than 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
	factor = !nullOrUndefined(factor) ? factor : randFloor(64);
	for (var i = 0, size = width * height * 4; i < size; i += 4) {
		var shift = data[i + 1] + factor;
		data[i] -= factor;
		data[i + 1] = shift > 255 ? 255 : shift;
		data[i + 2] -= factor;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Red Shift
 * @param {number} factor - factor by which to reduce green and blue channels and boost red channel
 */
Jimp.prototype.redShift = function redShift(factor, cb) {
	if (!nullOrUndefined(factor)) {
		if ('number' != typeof factor)
			return throwError.call(this, 'factor must be a number', cb);
		if (factor < 2)
			return throwError.call(this, 'factor must be greater than 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
	factor = !nullOrUndefined(factor) ? factor : randFloor(64);
	for (var i = 0, size = width * height * 4; i < size; i += 4) {
		var shift = data[i] + factor;
		data[i] = shift > 255 ? 255 : shift;
		data[i + 1] -= factor;
		data[i + 2] -= factor;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Blue Shift
 * @param {number} factor - factor by which to reduce red and green channels and boost blue channel
 */
Jimp.prototype.blueShift = function blueShift(factor, cb) {
	if (!nullOrUndefined(factor)) {
		if ('number' != typeof factor)
			return throwError.call(this, 'factor must be a number', cb);
		if (factor < 2)
			return throwError.call(this, 'factor must be greater than 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
	factor = !nullOrUndefined(factor) ? factor : randFloor(64);
	for (var i = 0, size = width * height * 4; i < size; i += 4) {
		var shift = data[i + 2] + factor;
		data[i] -= factor;
		data[i + 1] -= factor;
		data[i + 2] = shift > 255 ? 255 : shift;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * RGB Shift
 * @param {string} from - channel to shift color value from, 'r', 'g', or 'b'
 * @param {string} to - channel to shift color value to, 'r', 'g', or 'b'
 * @param {number} factor - factor by which to reduce other channels and boost the channel set by to
 */
Jimp.prototype.rgbShift = function rgbShift(from, to, factor, cb) {
	if (!nullOrUndefined(from)) {
		if ('string' != typeof from)
			return throwError.call(this, 'from must be a string', cb);
		if (
			from != 'r' ||
			from != 'g' ||
			from != 'b' ||
			from != 'red' ||
			from != 'green' ||
			from != 'blue'
		)
			return throwError.call(
				this,
				"from must be a string: 'red', 'green', 'blue', 'r', 'g', or 'b'",
				cb
			);
	}
	if (!nullOrUndefined(to)) {
		if ('string' != typeof to)
			return throwError.call(this, 'to must be a string', cb);
		if (
			to != 'r' ||
			to != 'g' ||
			to != 'b' ||
			to != 'red' ||
			to != 'green' ||
			to != 'blue'
		)
			return throwError.call(
				this,
				"to must be a string: 'red', 'green', 'blue', 'r', 'g', or 'b'",
				cb
			);
	}
	if (!nullOrUndefined(factor)) {
		if ('number' != typeof factor)
			return throwError.call(this, 'factor must be a number', cb);
		if (factor < 2)
			return throwError.call(this, 'factor must be greater than 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
	factor = !nullOrUndefined(factor) ? factor : randFloor(64);
	switch (from) {
		case 'red':
		case 'r':
			from = 0;
			break;
		case 'green':
		case 'g':
			from = 1;
			break;
		case 'blue':
		case 'b':
			from = 2;
			break;
		default:
			from = randRange(0, 2);
	}
	switch (to) {
		case 'red':
		case 'r':
			to = 0;
			break;
		case 'green':
		case 'g':
			to = 1;
			break;
		case 'blue':
		case 'b':
			to = 2;
			break;
		default:
			to = randRange(0, 2);
	}
	for (var i = 0, size = width * height * 4; i < size; i += 4) {
		var shift = data[i + from] + factor;
		switch (to) {
			case 0:
				data[i + 1] -= factor;
				data[i + 2] -= factor;
				break;
			case 1:
				data[i + 0] -= factor;
				data[i + 2] -= factor;
				break;
			case 2:
				data[i + 1] -= factor;
				data[i + 3] -= factor;
				break;
		}
		data[i + to] = shift > 255 ? 255 : shift;
	}
	// your code here
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Super Shift
 * @param {number} iter - number of times to shift color values
 * @param {boolean} dir - direction to shift colors, true for RGB->GBR, false for RGB->BRG.
 */
Jimp.prototype.superShift = function superShift(iter, dir, cb) {
	if (!nullOrUndefined(iter)) {
		if ('number' != typeof iter)
			return throwError.call(this, 'iter must be a number', cb);
		if (iter < 2)
			return throwError.call(this, 'iter must be greater than 1', cb);
	}
	if (!nullOrUndefined(dir))
		return throwError.call(this, 'dir must be truthy or falsey', cb);
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
	dir = !nullOrUndefined(dir) ? dir : coinToss();
	iter = !nullOrUndefined(iter) ? iter : randRange(1, 10);
	for (var i = 0, l = iter; i < l; i++) {
		for (var j = 0, size = width * height * 4; j < size; j += 4) {
			var r = data[j],
				g = data[j + 1],
				b = data[j + 2];
			data[j] = dir ? g : b;
			data[j + 1] = dir ? b : r;
			data[j + 2] = dir ? r : g;
		}
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Super Pixel Funk
 * @param {number} pixelation - size of pixels to use for pixelization
 */
Jimp.prototype.superPixelFunk = function superPixelFunk(pixelation, cb) {
	if (!nullOrUndefined(pixelation)) {
		if ('number' != typeof pixelation)
			return throwError.call(this, 'pixelation must be a number', cb);
		if (pixelation < 2)
			return throwError.call(this, 'pixelation must be greater than 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = new Uint32Array(this.bitmap.data.buffer);
	pixelation = !nullOrUndefined(pixelation) ? pixelation : randRange(2, 15);
	for (var y = 0; y < height; y += pixelation) {
		for (var x = 0; x < width; x += pixelation) {
			if (coinToss()) {
				var locale = coinToss();
				var mask = randChoice([0x00ff0000, 0x0000ff00, 0x000000ff]);
				var i = coinToss() ? y * width + x : y * width + (x - pixelation * 2);
				for (var n = 0; n < pixelation; n++) {
					for (var m = 0; m < pixelation; m++) {
						if (x + m < width) {
							var j = width * (y + n) + (x + m);
							data[j] = locale ? data[i] : data[j] | mask;
						}
					}
				}
			}
		}
	}
	this.bitmap.data.writeUInt32BE(data, 0);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Pixel Funk
 * @param {number} pixelation - size of pixels to use for pixelization
 */
Jimp.prototype.pixelFunk = function pixelFunk(pixelation, cb) {
	if (!nullOrUndefined(pixelation)) {
		if ('number' != typeof pixelation)
			return throwError.call(this, 'pixelation must be a number', cb);
		if (pixelation < 2)
			return throwError.call(this, 'pixelation must be greater than 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = new Uint32Array(this.bitmap.data.buffer);
	pixelation = !nullOrUndefined(pixelation) ? pixelation : randRange(2, 10);
	for (var y = 0; y < height; y += pixelation) {
		for (var x = 0; x < width; x += pixelation) {
			if (coinToss()) {
				var i = y * width + x;
				for (var n = 0; n < pixelation; n++) {
					for (var m = 0; m < pixelation; m++) {
						if (x + m < width) {
							var j = width * (y + n) + (x + m);
							data[j] = data[i];
						}
					}
				}
			}
		}
	}
	this.bitmap.data.writeUInt32BE(data, 0);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Focus Image
 * @param {number} pixelation - size of pixels to use for pixelization
 */
Jimp.prototype.focusImage = function focusImage(pixelation, cb) {
	if (!nullOrUndefined(pixelation)) {
		if ('number' != typeof pixelation)
			return throwError.call(this, 'pixelation must be a number', cb);
		if (pixelation < 2)
			return throwError.call(this, 'pixelation must be greater than 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = new Uint32Array(this.bitmap.data.buffer);
	pixelation = !nullOrUndefined(pixelation) ? pixelation : randRange(2, 10);
	for (var y = 0; y < height; y += pixelation) {
		for (var x = 0; x < width; x += pixelation) {
			var i = y * width + x;
			for (var n = 0; n < pixelation; n++) {
				for (var m = 0; m < pixelation; m++) {
					if (x + m < width) {
						var j = width * (y + n) + (x + m);
						data[j] = data[i];
					}
				}
			}
		}
	}
	this.bitmap.data.writeUInt32BE(data, 0);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Slice
 * @param {number} cutstart - datapoint to begin cut
 * @param {number} cutend - datapoint to finalize cut
 */
Jimp.prototype.slice = function slice(cutstart, cutend, cb) {
	if (!nullOrUndefined(cutstart)) {
		if ('number' != typeof cutstart)
			return throwError.call(this, 'cutstart must be a number', cb);
		if (cutstart > 0 && cutstart < cutend)
			return throwError.call(
				this,
				'cutstart must be greater than 0 and less than cutend',
				cb
			);
	}
	if (!nullOrUndefined(cutend)) {
		if ('number' != typeof cutend)
			return throwError.call(this, 'cutend must be a number', cb);
		if (cutend > 0 && cutend > cutstart)
			return throwError.call(
				this,
				'cutend must be greater than 0 and greater than cutstart',
				cb
			);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
	cutend = !nullOrUndefined(cutend) ? cutend : randFloor(width * height * 4);
	cutstart = !nullOrUndefined(cutstart) ? cutstart : Math.floor(cutend / 1.7);
	var cut = data.subarray(cutstart, cutend);
	data.set(cut, randFloor(width * height * 4 - cut.length));
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Select Slice
 * @param {number} selection - Algorithm to use to make an automatic slice (currently 0 or 1)
 */
Jimp.prototype.selectSlice = function selectSlice(selection, cb) {
	if (!nullOrUndefined(selection)) {
		if ('number' != typeof selection)
			return throwError.call(this, 'selection must be a number', cb);
		if (selection < 0 && selection > 1)
			return throwError.call(this, 'selection must be 0 or 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data,
		cutend,
		cutstart;
	selection = !nullOrUndefined(selection) ? selection : randRange(0, 1);

	switch (selection) {
		case 0:
			cutend = randFloor(width * height * 4);
			cutstart = Math.floor(cutend / 1.7);
			break;
		case 1:
			cutend =
				Math.random() < 0.75
					? randFloor(width * height * 4)
					: width * height * 4;
			cutstart = Math.floor(cutend / 1.7);
			break;
	}
	var cut = data.subarray(cutstart, cutend);
	data.set(cut, randFloor(width * height * 4 - cut.length));
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Super Slice
 * @param {number} iter - Number of times to perform an automatic slice
 */
Jimp.prototype.superSlice = function superSlice(iter, cb) {
	if (!nullOrUndefined(iter)) {
		if ('number' != typeof iter)
			return throwError.call(this, 'iter must be a number', cb);
		if (iter > 0)
			return throwError.call(this, 'iter must be greater than 0', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data,
		cutend,
		cutstart;
	iter = !nullOrUndefined(iter) ? iter : 3;
	for (var i = 0; i < iter; i++) {
		switch (randRange(0, 1)) {
			case 0:
				cutend = randFloor(width * height * 4);
				cutstart = Math.floor(cutend / 1.7);
				break;
			case 1:
				cutend =
					Math.random() < 0.75
						? randFloor(width * height * 4)
						: width * height * 4;
				cutstart = Math.floor(cutend / 1.7);
				break;
		}
		var cut = data.subarray(cutstart, cutend);
		data.set(cut, randFloor(width * height * 4 - cut.length));
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Fractal Ghosts
 * @param {number} type - A number from 0-3 determining which algorithm to use
 * @param {number} color - The color channel to use to create the ghosts
 */
Jimp.prototype.fractalGhosts = function fractalGhosts(type, color, cb) {
	if (!nullOrUndefined(type)) {
		if (typeof type != 'number')
			return throwError.call(this, 'type must be a number', cb);
		if (type < 0 || type > 3)
			return throwError.call(this, 'type must be a between 0 and 3', cb);
	}
	if (!nullOrUndefined(color)) {
		if (typeof color != 'number')
			return throwError.call(this, 'color must be a number', cb);
		if (color < 0 || color > 4)
			return throwError.call(this, 'color must be a between 0 and 4', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data,
		rand = randRange(1, 10),
		tmp = null;
	type = !nullOrUndefined(type) ? type : randRange(0, 3);
	color = !nullOrUndefined(color) ? color : randRange(0, 4);
	switch (type) {
		case 0:
			for (var i = 0; i < data.length; i++) {
				if (parseInt(data[(i * 2) % data.length], 10) < parseInt(data[i], 10)) {
					data[i] = data[(i * 2) % data.length];
				}
			}
			break;
		case 1:
			for (var i = 0; i < data.length; i++) {
				tmp = (i * rand) % data.length;
				if (parseInt(data[tmp], 10) < parseInt(data[i], 10)) {
					data[i] = data[tmp];
				}
			}
			break;
		case 2:
			for (var i = 0; i < data.length; i++) {
				if (i % 4 === color) {
					data[i] = 0xff;
					continue;
				}
				tmp = (i * rand) % data.length;
				if (parseInt(data[tmp], 10) < parseInt(data[i], 10)) {
					data[i] = data[tmp];
				}
			}
			break;
		case 3:
			for (var i = 0; i < data.length; i++) {
				if (i % 4 === color) {
					data[i] = 0xff;
					continue;
				}
				if (parseInt(data[(i * 2) % data.length], 10) < parseInt(data[i], 10)) {
					data[i] = data[(i * 2) % data.length];
				}
			}
			break;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Fractal
 * @param {number} type - A number from (currently 0 or 1) determining which algorithm to use
 */
Jimp.prototype.fractal = function fractal(type, cb) {
	if (!nullOrUndefined(type)) {
		if (typeof type != 'number')
			return throwError.call(this, 'type must be a number', cb);
		if (type < 0 || type > 1)
			return throwError.call(this, 'type must be a 0 or 1', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = this.bitmap.data;
	type = !nullOrUndefined(type) ? type : randRange(0, 1);
	switch (type) {
		case 0:
			for (var i = data.length; i; i--) {
				if (parseInt(data[(i * 2) % data.length], 10) < parseInt(data[i], 10)) {
					data[i] = data[(i * 2) % data.length];
				}
			}
			break;
		case 1:
			var m = randRange(2, 8);
			for (var j = 0; j < data.length; j++) {
				if (parseInt(data[(j * m) % data.length], 10) < parseInt(data[j], 10)) {
					data[j] = data[(j * m) % data.length];
				}
			}
			break;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

Jimp.prototype.shortsort = function shortsort(cutStart, cutFinish, cb) {
	if (!nullOrUndefined(cutStart)) {
		if (typeof cutStart != 'number')
			return throwError.call(this, 'cutStart must be a number', cb);
	}
	if (!nullOrUndefined(cutFinish)) {
		if (typeof cutFinish != 'number')
			return throwError.call(this, 'cutFinish must be a number', cb);
	}
	var width = this.bitmap.width,
		height = this.bitmap.height,
		data = new Uint32Array(this.bitmap.data),
		mm = !nullOrUndefined(cutStart) ? cutStart : randMinMax(0, height * width),
		cut;
	mm = !nullOrUndefined(cutFinish) ? cutFinish : randMinMax2(mm[0], mm[1]);
	cut = data.subarray(mm[0], mm[1]);
	if (coinToss()) {
		Array.prototype.sort.call(cut, leftSort);
	} else {
		Array.prototype.sort.call(cut, rightSort);
	}

	this.bitmap.data = new Buffer(data.buffer);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/* TODO: convert to JIMP

	 gleech.shortdumbsort = function shortdumbsort(imageData) {
	 var data = new Uint32Array(imageData.data.buffer),
	 mm = randMinMax(0, imageData.width * imageData.height), da;
	 mm = randMinMax2(mm[0], mm[1]);
	 da = data.subarray(mm[0], mm[1]);
	 Array.prototype.sort.call(da);
	 imageData.data.set(da, mm[0]);
	 return imageData;
	 };

	 gleech.sort = function sort(imageData) {
	 var data = new Uint32Array(imageData.data.buffer);
	 if (coinToss()) {
	 Array.prototype.sort.call(data, leftSort);
	 } else {
	 Array.prototype.sort.call(data, rightSort);
	 }
	 imageData.data.set(data, 0);
	 return imageData;
	 };
	 gleech.slicesort = function slicesort(imageData) {
	 var data = new Uint32Array(imageData.data.buffer),
	 mm = randMinMax(0, data.length);
	 mm = randMinMax(mm[0], mm[1]);
	 mm = randMinMax(mm[0], mm[1]);
	 var cut = data.subarray(mm[0], mm[1]),
	 offset = Math.abs(randRound(data.length) - cut.length) % data.length;
	 Array.prototype.sort.call(cut, leftSort);
	 imageData.data.set(data.buffer, coinToss() ? offset : mm[0]);
	 return imageData;
	 };

	 gleech.sortRows = function sortRows(imageData) {
	 var data = new Uint32Array(imageData.data.buffer),
	 width = imageData.width, height = imageData.height;
	 for (var i = 0, size = data.length + 1; i < size; i += width) {
	 var da = data.subarray(i, i + width);
	 Array.prototype.sort.call(da, leftSort);
	 da.copyWithin(data, i);
	 }
	 imageData.data.set(data.buffer);
	 return imageData;
	 };

	 gleech.sortStripe = function sortStripe(imageData) {
	 var data = new Uint32Array(imageData.data.buffer),
	 width = imageData.width,
	 mm = randMinMax(0, width);
	 mm = randMinMax2(mm[0], mm[1]);
	 for (var i = 0, size = data.length + 1; i < size; i += width) {
	 var da = data.subarray(i + mm[0], i + mm[1]);
	 Array.prototype.sort.call(da, leftSort);
	 da.copyWithin(data, i + mm[0]);
	 }
	 imageData.data.set(data.buffer);
	 return imageData;
	 };


	 gleech.dumbSortRows = function dumbSortRows(imageData) {
	 var data = new Uint32Array(imageData.data.buffer),
	 width = imageData.width, height = imageData.height;
	 for (var i = 0, size = data.length; i < size; i += width) {
// var mm = randMinMax(i, i + width);
// var da = data.subarray(mm[0], mm[1]);
var da = data.subarray(i, i + width);
Array.prototype.sort.call(da);
data.set(da, i);
// for (var i = 0, size = data.length; i < size; i += width) {
// var da = Array.apply([], data.subarray(i, i + width));
// da.sort(coinToss);
// data.set(da, i);
}
imageData.data.set(data.buffer);
return imageData;
};

gleech.randomSortRows = function randomSortRows(imageData) {
	var data = new Uint32Array(imageData.data.buffer),
	width = imageData.width, height = imageData.height;
	for (var i = 0, size = data.length; i < size; i += width) {
		// var mm = randMinMax(i, i + width);
		// var da = data.subarray(mm[0], mm[1]);
		var da = data.subarray(i, i + width);
		Array.prototype.sort.call(da, coinToss);
		data.set(da, i);
		// for (var i = 0, size = data.length; i < size; i += width) {
		// var da = Array.apply([], data.subarray(i, i + width));
		// da.sort(coinToss);
		// data.set(da, i);
	}
	imageData.data.set(data.buffer);
	return imageData;
	};

	gleech.invert = function invert(imageData) {
		var data = new Uint32Array(imageData.data.buffer);
		for (var i = 0; i < data.length; i++) {
			data[i] = ~ data[i] | 0xFF000000;
		}
		imageData.data.set(data.buffer);
		return imageData;
	};
	gleech.rgb_glitch = function rgb_glitch(imageData) {
		var data = imageData.data,
		width = imageData.width,
		height = imageData.height,
		mm = randMinMax(10, width - 10),
		opt = mm[1] % 3,
		dir = coinToss();
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var index = ((width * y) + x) * 4,
					red = data[index],
					green = data[index + 1],
					blue = data[index + 2];
					if (dir) {
						if (opt === 0) {
							data[index + mm[0]] = red;
							data[index + mm[0] + 1] = green;
							data[index] = blue;
						}else if (opt === 1) {
							data[index] = red;
							data[index + mm[0] + 1] = green;
							data[index + mm[0]] = blue;
						} else {
							data[index + mm[0]] = red;
							data[index + 1] = green;
							data[index + mm[0]] = blue;
						}
					} else {
						if (opt === 0) {
							data[index - mm[0] + 1] = red;
							data[index - mm[0]] = green;
							data[index] = blue;
						}else if (opt === 1) {
							data[index + 1] = red;
							data[index - mm[0]] = green;
							data[index - mm[0]] = blue;
						} else {
							data[index - mm[0] + 1] = red;
							data[index] = green;
							data[index - mm[0]] = blue;
						}
					}
			}
		}
		imageData.data.set(data);
		return imageData;
	};
	gleech.DrumrollVerticalWave = function DrumrollVerticalWave(imageData) {
		// borrowed from https://github.com/ninoseki/glitched-canvas & modified w/
		// cosine
		var data = imageData.data,
		width = imageData.width,
		height = imageData.height,
		roll = 0;
		for (var x = 0; x < width; x++) {
			if (Math.random() > 0.95) roll = Math.floor(Math.cos(x) * (height * 2));
			if (Math.random() > 0.98) roll = 0;

			for (var y = 0; y < height; y++) {
				var idx = (x + y * width) * 4;

				var y2 = y + roll;
				if (y2 > height - 1) y2 -= height;
				var idx2 = (x + y2 * width) * 4;

				for (var c = 0; c < 4; c++) {
					data[idx2 + c] = data[idx + c];
				}
			}
		}

		imageData.data.set(data);
		return imageData;
	};
	gleech.DrumrollHorizontalWave = function DrumrollHorizontalWave(imageData) {
		// borrowed from https://github.com/ninoseki/glitched-canvas & modified
		// with cosine
		var data = imageData.data,
		width = imageData.width,
		height = imageData.height,
		roll = 0;
		for (var x = 0; x < width; x++) {
			if (Math.random() > 0.95) roll = Math.floor(Math.cos(x) * (height * 2));
			if (Math.random() > 0.98) roll = 0;

			for (var y = 0; y < height; y++) {
				var idx = (x + y * width) * 4;

				var x2 = x + roll;
				if (x2 > width - 1) x2 -= width;
				var idx2 = (x2 + y * width) * 4;

				for (var c = 0; c < 4; c++) {
					data[idx2 + c] = data[idx + c];
				}
			}
		}

		imageData.data.set(data);
		return imageData;
	};
	gleech.DrumrollVertical = function DrumrollVertical(imageData) {
		// borrowed from https://github.com/ninoseki/glitched-canvas
		var data = imageData.data,
		width = imageData.width,
		height = imageData.height,
		roll = 0;
		for (var x = 0; x < width; x++) {
			if (Math.random() > 0.95) roll = randFloor(height);
			if (Math.random() > 0.95) roll = 0;

			for (var y = 0; y < height; y++) {
				var idx = (x + y * width) * 4;

				var y2 = y + roll;
				if (y2 > height - 1) y2 -= height;
				var idx2 = (x + y2 * width) * 4;

				for (var c = 0; c < 4; c++) {
					data[idx2 + c] = data[idx + c];
				}
			}
		}

		imageData.data.set(data);
		return imageData;
	};
	gleech.DrumrollHorizontal = function DrumrollHorizontal(imageData) {
		// borrowed from https://github.com/ninoseki/glitched-canvas
		var data = imageData.data,
		width = imageData.width,
		height = imageData.height,
		roll = 0;
		for (var x = 0; x < width; x++) {
			if (Math.random() < 0.05) roll = randFloor(height);
			if (Math.random() < 0.05) roll = 0;

			for (var y = 0; y < height; y++) {
				var idx = (x + y * width) * 4;

				var x2 = x + roll;
				if (x2 > width - 1) x2 -= width;
				var idx2 = (x2 + y * width) * 4;

				for (var c = 0; c < 4; c++) {
					data[idx2 + c] = data[idx + c];
				}
			}
		}

		imageData.data.set(data);
		return imageData;
	};

	gleech.scanlines = function scanlines(imageData) {
		// future options:
		// type, xor/or ammount, stripe width
		var data = new Uint32Array(imageData.data.buffer),
		width = imageData.width, height = imageData.height,
		type = randRange(0, 3),
		size = randRange(3, 15),
		xorNum = randChoice([0x00555555, 0x00FF00FF00, 0x00F0F0F0, 0x00333333]),
		orNum = randChoice([0xFF555555, 0xFFFF00FF00, 0xFFF0F0F0, 0xFF333333]);
		for (var i = 0, l = data.length; i < l; i += (width * size)) {
			var row = Array.apply([], data.subarray(i, i + width));
			for (var p in row) {
				if (type === 0) {
					row[p] = row[p] ^ xorNum;
				} else if (type === 1) {
					row[p] = row[p] | orNum;
				} else {
					// invert
					row[p] = ~ row[p] | 0xFF000000;
				}
			}
			data.set(row, i);
		}
		imageData.data.set(data.buffer);
		return imageData;
	};

	gleech.pixelSort = function pixelSort(imageData) {
		var data = new Uint32Array(imageData.data.buffer),
		width = imageData.width, height = imageData.height;
		var upper = 0xFFAAAAAA, lower = 0xFF333333;
		for (var i = 0, size = data.length; i < size; i += width) {
			var row = Array.apply([], data.subarray(i, i + width));
			var low = 0, high = 0;
			for (var j in row) {
				if (!high && !low && row[j] >= low) {
					low = j;
				}
				if (low && !high && row[j] >= high) {
					high = j;
				}
			}
			if (low) {
				var da = row.slice(low, high);
				Array.prototype.sort.call(da, leftSort);
				data.set(da, (i + low) % (height * width));
			}
		}
		imageData.data.set(data.buffer);
		return imageData;
	};


	*/

module.exports = Jimp;
