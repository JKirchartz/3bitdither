(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (Buffer){
/*
 * Gleech.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Extend JIMP with glitches
 *
 * Distributed under terms of the GPL 3.0 (General Public License) license.
 */

'use strict';

if( typeof module !== 'undefined' && module.exports ) {
	var Jimp = require('jimp');
}


/***************************************************
 * Helper Functions
 ***************************************************/

function throwError(err, cb) {
	if (typeof err === 'string') err = new Error(err);
	if(typeof cb === 'function') return cb.call(this, err);
	else throw err;
}

function adjustPixelError(data, i, error, multiplier) {
	data[i] = data[i] + multiplier * error[0];
	data[i + 1] = data[i + 1] + multiplier * error[1];
	data[i + 2] = data[i + 2] + multiplier * error[2];
}

function nullOrUndefined(item) {
	if (typeof item === 'undefined' || item === null) {
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


/**
 * Blue Shift
 * @param {number} factor - factor by which to reduce red and green channels and boost blue channel
 */
Jimp.prototype.blueShift = function blueShift(factor, cb) {
	if (!nullOrUndefined(factor)) {
		if ("number" != typeof factor)
			return throwError.call(this, "factor must be a number", cb);
		if (factor < 2)
			return throwError.call(this, "factor must be greater than 1", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data;
	factor = !nullOrUndefined(factor) ? factor : randFloor(64);
	for (var i = 0, size = width * height * 4; i < size; i += 4) {
		var shift = data[i + 2] + factor;
		data[i] -= factor;
		data[i + 1] -= factor;
		data[i + 2] = (shift) > 255 ? 255 : shift;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


// todo: rewrite colorShift functions to match Jimp.prototype.sepia

/**
 * Color Shift
 * @param {boolean} dir - direction to shift colors, true for RGB->GBR, false for RGB->BRG.
 */
Jimp.prototype.colorShift = function colorShift(dir, cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data;
	dir = nullOrUndefined(dir) ? coinToss() : dir;
	if (!nullOrUndefined(dir) && typeof (!!dir) !== 'boolean') {
		return throwError.call(this, "dir must be truthy or falsey", cb);
	}
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


/**
 * colorShift2
 * @param {boolean} dir - direction to shift pixels (left or right)
 */
Jimp.prototype.colorShift2 = function colorShift2(dir, cb) {
	if (!nullOrUndefined(dir))
		return throwError.call(this, "dir must be truthy or falsey", cb);
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data;
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


/**
 * Dither: 8 bits
 * @param {number} size - a number greater than 1 representing pixel size.
 */
Jimp.prototype.dither8Bit = function dither8Bit(size, cb) {
	size = nullOrUndefined(size) ? randRange(4, 15) : size;
	if (typeof size !== 'number') {
		return throwError.call(this, "size must be a number " + size, cb);
	}
	if (size < 2) {
		return throwError.call(this, "size must be greater than 1", cb);
	}

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


/**
 * Dither: Bayer
 * @param {number} map - which matrix to use for the threshold map - 0: 3x3,  1: 4x4, 2: 8x8
 */
Jimp.prototype.ditherBayer = function ditherBayer(map, cb) {
	map = !nullOrUndefined(map) ? map : randFloor(3);
	if ("number" !== typeof map)
		return throwError.call(this, "map must be a number", cb);
	if (map < 0 || map > 2)
		return throwError.call(this, "map must be a number from 0 to 2", cb);

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


/**
 * Dither: Bayer 3 - full-color bayer algo
 * @param {number} map - which matrix to use for the threshold map - 0: 3x3,  1: 4x4, 2: 8x8
 */
Jimp.prototype.ditherBayer3 = function ditherBayer3(map, cb) {
	map = !nullOrUndefined(map) ? map : randFloor(3);
			if (typeof map !== 'number')
			return throwError.call(this, "map must be a number", cb);
			if (map < 0 || map > 2)
			return throwError.call(this, "map must be a number from 0 to 2", cb);
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


/**
 * Dither: Bitmask
 * @param {number} mask - number with which to mask each color channel 1-254
 */
Jimp.prototype.ditherBitmask = function ditherBitmask(mask, cb) {
	if (!nullOrUndefined(mask)) {
		if ("number" != typeof mask)
			return throwError.call(this, "mask must be a number", cb);
		if (mask < 0 || mask > 254)
			return throwError.call(this, "mask must be a number from 0 to 2", cb);
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


/**
 * Dither: Halftone
 */
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
 * drumrollHorizontal
 */
Jimp.prototype.drumrollHorizontal = function drumrollHorizontal(cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data,
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

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * drumrollHorizontalWave
 */
Jimp.prototype.drumrollHorizontalWave = function drumrollHorizontalWave(cb) {
	// borrowed from https://github.com/ninoseki/glitched-canvas & modified with cosine
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data,
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

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * drumrollVertical
 */
Jimp.prototype.drumrollVertical = function drumrollVertical(cb) {
	// borrowed from https://github.com/ninoseki/glitched-canvas
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data,
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

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * drumrollVerticalWave
 */
Jimp.prototype.drumrollVerticalWave = function drumrollVerticalWave(cb) {
	// borrowed from https://github.com/ninoseki/glitched-canvas & modified w/ cosine
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data,
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

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * dumbSortRows
 */
Jimp.prototype.dumbSortRows = function dumbsSortRows(cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data);

	for (var i = 0, size = data.length; i < size; i += width) {
		var da = data.subarray(i, i + width);
		Array.prototype.sort.call(da);
		data.set(da, i);
	}

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * Focus Image
 * @param {number} pixelation - size of pixels to use for pixelization
 */
Jimp.prototype.focusImage = function focusImage(pixelation, cb) {
	if (!nullOrUndefined(pixelation)) {
		if ("number" != typeof pixelation)
			return throwError.call(this, "pixelation must be a number", cb);
		if (pixelation < 2)
			return throwError.call(this, "pixelation must be greater than 1", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data.buffer);
	pixelation = !nullOrUndefined(pixelation) ? pixelation : randRange(2, 10);
	for (var y = 0; y < height; y += pixelation) {
		for (var x = 0; x < width; x += pixelation) {
			var i = (y * width + x);
			for (var n = 0; n < pixelation; n++) {
				for (var m = 0; m < pixelation; m++) {
					if (x + m < width) {
						var j = ((width * (y + n)) + (x + m));
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
 * Fractal
 * @param {number} type - A number from (currently 0 or 1) determining which algorithm to use
 */
Jimp.prototype.fractal = function fractal(type, cb) {
	if(!nullOrUndefined(type)) {
		if (typeof type != 'number')
			return throwError.call(this, "type must be a number", cb);
		if (type < 0 || type > 1)
			return throwError.call(this, "type must be a 0 or 1", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data;
	type = !nullOrUndefined(type) ? type : randRange(0,1);
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


/**
 * Fractal Ghosts
 * @param {number} type - A number from 0-3 determining which algorithm to use
 * @param {number} color - The color channel to use to create the ghosts
 */
Jimp.prototype.fractalGhosts = function fractalGhosts(type, color, cb) {
	if(!nullOrUndefined(type)) {
		if (typeof type != 'number')
			return throwError.call(this, "type must be a number", cb);
		if (type < 0 || type > 3)
			return throwError.call(this, "type must be a between 0 and 3", cb);
	}
	if(!nullOrUndefined(color)) {
		if (typeof color != 'number')
			return throwError.call(this, "color must be a number", cb);
		if (color < 0 || color > 4)
			return throwError.call(this, "color must be a between 0 and 4", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data,
	rand = randRange(1, 10),
	tmp = null;
	type = !nullOrUndefined(type) ? type : randRange(0,3);
	color = !nullOrUndefined(color) ? color : randRange(0,4);
	switch (type) {
		case 0:
			for (var i = 0; i < data.length; i++) {
				if (parseInt(data[i * 2 % data.length], 10) < parseInt(data[i], 10)) {
					data[i] = data[i * 2 % data.length];
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
				if ((i % 4) === color) {
					data[i] = 0xFF;
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
				if ((i % 4) === color) {
					data[i] = 0xFF;
					continue;
				}
				if (parseInt(data[i * 2 % data.length], 10) < parseInt(data[i], 10)) {
					data[i] = data[i * 2 % data.length];
				}
			}
			break;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * Glitch - randomly choose glitch functions to perform on the incoming image
 */
Jimp.prototype.glitch = function (cb) {
	// chose and run random functions
	var hist = [];
	for (var i = 0, l = randRange(5, 10); i < l; i++) {
		switch (randFloor(13)) {
			case 0:
				this.focusImage();
				hist.push('focusImage');
				break;
			case 1:
				this.ditherBitmask();
				hist.push('ditherBitmask');
				break;
			case 2:
				if (Math.random() > 0.5) {
					this.superSlice();
				} else {
					this.superSlice2();
				}
				hist.push('superSlice/2');
				break;
			case 3:
				this.colorShift();
				hist.push('colorShift');
				break;
			case 4:
				this.ditherRandom3();
				hist.push('ditherRandom3');
				break;
			case 5:
				this.ditherBayer3();
				hist.push('ditherBayer3');
				break;
			case 6:
				this.ditherAtkinsons();
				hist.push('ditherAtkinsons');
				break;
			case 7:
				this.ditherFloydSteinberg();
				hist.push('ditherFloydSteinberg');
				break;
			case 8:
				this.ditherHalftone();
				hist.push('ditherHalftone');
				break;
			case 9:
				this.dither8Bit();
				hist.push('dither8bit');
				break;
			case 10:
				if (coinToss()) {
					var picker = randFloor(3);
					if (picker == 1) {
						this.redShift();
						hist.push('redShift');
					} else if (picker == 2) {
						this.greenShift();
						hist.push('greenShift');
					} else {
						this.blueShift();
						hist.push('blueShift');
					}
				}
				break;
			default:
				this.invert();
				hist.push('invert');
				break;
		}
	}
	console.log('glitch history: ', hist.join(', '));
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * Green Shift
 * @param {number} factor - factor by which to reduce red and blue channels and boost green channel
 */
Jimp.prototype.greenShift = function greenShift(factor, cb) {
	if (!nullOrUndefined(factor)) {
		if ("number" != typeof factor)
			return throwError.call(this, "factor must be a number", cb);
		if (factor < 2)
			return throwError.call(this, "factor must be greater than 1", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data;
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


/**
 * inverse
 */
Jimp.prototype.inverse = function inverse(cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data);
	for (var i = 0; i < data.length; i++) {
		data[i] = ~ data[i] | 0xFF000000;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * Pixel Funk
 * @param {number} pixelation - size of pixels to use for pixelization
 */
Jimp.prototype.pixelFunk = function pixelFunk(pixelation, cb) {
	if (!nullOrUndefined(pixelation)) {
		if ("number" != typeof pixelation)
			return throwError.call(this, "pixelation must be a number", cb);
		if (pixelation < 2)
			return throwError.call(this, "pixelation must be greater than 1", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data.buffer);
	pixelation = !nullOrUndefined(pixelation) ? pixelation : randRange(2, 10);
	for (var y = 0; y < height; y += pixelation) {
		for (var x = 0; x < width; x += pixelation) {
			if (coinToss()) {
				var i = (y * width + x);
				for (var n = 0; n < pixelation; n++) {
					for (var m = 0; m < pixelation; m++) {
						if (x + m < width) {
							var j = ((width * (y + n)) + (x + m));
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
 * pixelSort
 */
Jimp.prototype.pixelSort = function pixelSort(cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data);

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

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * Preset - sequentially run ___ with random parameters
 * number - which preset to run (1-4) (default to 5 random glitches)
 */
Jimp.prototype.preset = function (number, cb) {
	var ops = [];
	switch(number) {
		case 1:
			ops = ['ditherRandom3', 'shortdumbsort', 'slice', 'invert', 'shortsort', 'shortsort', 'ditherRandom3', 'DrumrollVerticalWave', 'ditherBayer3', 'dumbSortRows', 'slicesort', 'DrumrollVertical'];
			break;
		case 2:
			ops = ['shortsort', 'slice2', 'fractalGhosts4', 'sort', 'fractalGhosts2', 'colorShift'];
			break;
		case 3:
			ops = ['ditherRandom3', 'focusImage', 'scanlines'];
			break;
		case 4:
			ops = ['ditherAtkinsons', 'focusImage', 'ditherRandom3', 'focusImage'];
			break;
		default:
			ops = ['glitch', 'glitch', 'glitch', 'glitch', 'glitch'];
			break;
	}
	for (var i in ops) {
		this[ops[i]]();
	}
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};



/**
 * randomGlitch - randomly choose glitch functions to perform on the incoming image
 */
Jimp.prototype.randomGlitch = function (imageData) {
	var history = [];
	// enumerate glitch functions
	var glitches = [];
	for (var prop in this) {
		if (typeof this[prop] === 'function' &&
				this[prop].name){
			glitches.push(this[prop].name);
		}
	}
	for (var i = 0, l = randRange(3, 6); i < l; i++) {
		var fun = randFloor(glitches.length);
		this[glitches[fun]](imageData);
		history.push(glitches[fun]);
	}
	if (history.length === 0) {
		return this.randomGlitch(imageData);
	}
	console.log('randomGlitch history:', history);
	return imageData;
};

/**
 * randomSortRows
 */
Jimp.prototype.randomSortRows = function randomSortRows(cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data);
	for (var i = 0, size = data.length; i < size; i += width) {
		var da = data.subarray(i, i + width);
		Array.prototype.sort.call(da, coinToss);
		data.set(da, i);
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
		if ("number" != typeof factor)
			return throwError.call(this, "factor must be a number", cb);
		if (factor < 2)
			return throwError.call(this, "factor must be greater than 1", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data;
	factor = !nullOrUndefined(factor) ? factor : randFloor(64);
	for (var i = 0, size = width * height * 4; i < size; i += 4) {
		var shift = data[i] + factor;
		data[i] = (shift) > 255 ? 255 : shift;
		data[i + 1] -= factor;
		data[i + 2] -= factor;
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * rgb_glitch
 * @param {number} offset - pixels to offset
 * @param {number} rgb - number representing R (0), G (1), or B (2)
 * @param {boolean} direction - shift pixels left or right, truthy for left, falsey for right
 */
Jimp.prototype.rgb_glitch = function rgb_glitch(offset, rgb, dir, cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data;
	offset = nullOrUndefined(offset) ? randRange(10, width - 10) : offset % width;
	rgb = !nullOrUndefined(rgb) ? rgb % 3 : offset % 3;
	dir = nullOrUndefined(dir) ? coinToss() : !!dir;
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var index = ((width * y) + x) * 4,
				red = data[index],
				green = data[index + 1],
				blue = data[index + 2];
				if (dir) {
					if (rgb === 0) {
						data[index + offset] = red;
						data[index + offset + 1] = green;
						data[index] = blue;
					}else if (rgb === 1) {
						data[index] = red;
						data[index + offset + 1] = green;
						data[index + offset] = blue;
					} else {
						data[index + offset] = red;
						data[index + 1] = green;
						data[index + offset] = blue;
					}
				} else {
					if (rgb === 0) {
						data[index - offset + 1] = red;
						data[index - offset] = green;
						data[index] = blue;
					}else if (rgb === 1) {
						data[index + 1] = red;
						data[index - offset] = green;
						data[index - offset] = blue;
					} else {
						data[index - offset + 1] = red;
						data[index] = green;
						data[index - offset] = blue;
					}
				}
		}
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
			from = randRange(0,2);
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
			to = randRange(0,2);
	}
	if (!nullOrUndefined(from) && typeof from !== 'number') {
		if ("string" !== typeof from) {
			return throwError.call(this, "from must be a string", cb);
		}
		if (from !== 'r' || from !== 'g' || from !== 'b' || from !== 'red' || from !== 'green' || from !== 'blue') {
			return throwError.call(this, "from must be a string: 'red', 'green', 'blue', 'r', 'g', or 'b'", cb);
		}
	}
	if (!nullOrUndefined(to) && typeof from !== 'number') {
		if ("string" !== typeof to) {
			return throwError.call(this, "to must be a string", cb);
		}
		if (to !== 'r' || to !== 'g' || to !== 'b' || to !== 'red' || to !== 'green' || to !== 'blue') {
			return throwError.call(this, "to must be a string: 'red', 'green', 'blue', 'r', 'g', or 'b'", cb);
		}
	}
	if (!nullOrUndefined(factor) && typeof from !== 'number') {
		if ("number" !== typeof factor) {
				return throwError.call(this, "factor must be a number", cb);
		}
		if (factor < 2) {
			return throwError.call(this, "factor must be greater than 1", cb);
		}
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
		data[i + to] = (shift) > 255 ? 255 : shift;
	}
	// your code here
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * scanlines
 * @param {number} type - 0 for xor, 1 for or, or 2 for invert
 * @param {number} size - size between scanlines, numbers between 3 and 15 look nice
 * @param {number} option - 0, 1, 2, or 3, to determine which value to use with Or or Xor
 */
Jimp.prototype.scanlines = function scanlines(type, size, option, cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data),
	xorOptions = [0x00555555, 0x00FF00FF00, 0x00F0F0F0, 0x00333333],
	orOptions = [0xFF555555, 0xFFFF00FF00, 0xFFF0F0F0, 0xFF333333];

	type = nullOrUndefined(type) ? randRange(0, 3) : type % 3;
	size = nullOrUndefined(size) ? randRange(3, 15) : size;
	var xorNum = nullOrUndefined(option) ? randChoice(xorOptions) : xorOptions[option];
	var orNum = nullOrUndefined(option) ? randChoice(orOptions) : orOptions[option];
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
		if ("number" != typeof selection)
			return throwError.call(this, "selection must be a number", cb);
		if (selection < 0 && selection > 1)
			return throwError.call(this, "selection must be 0 or 1", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data,
	cutend, cutstart;
	selection = !nullOrUndefined(selection) ? selection : randRange(0,1);

	switch (selection) {
		case 0:
			cutend = randFloor(width * height * 4);
			cutstart = Math.floor(cutend / 1.7);
			break;
		case 1:
			cutend = Math.random() < 0.75 ? randFloor(width * height * 4) : (width * height * 4);
			cutstart = Math.floor(cutend / 1.7);
			break;
	}
	var cut = data.subarray(cutstart, cutend);
	data.set(cut, randFloor((width * height * 4) - cut.length));
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * shortdumbsort
 * @param {integer} start - pixel to start at
 * @param {integer} end - pixel to end at
 */
Jimp.prototype.shortdumbsort = function shortdumbsort(start, end, cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data.buffer);
	var mm;
	if (nullOrUndefined(start) && nullOrUndefined(end)) {
		mm = randMinMax(0, width * height);
		mm = randMinMax2(mm[0], mm[1]);
	} else if(!nullOrUndefined(start) && nullOrUndefined(end)) {
		mm = randMinMax(start, randRange(start, width * height));
	} else if(nullOrUndefined(start) && !nullOrUndefined(end)) {
		mm = randMinMax(randRange(0, (width * height) - end), end);
	} else {
		mm = [start, end];
	}
	var da = data.subarray(mm[0], mm[1]);
	Array.prototype.sort.call(da);
	data.set(da, mm[0]);
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * shortsort
 * @param {integer} start - pixel to start at
 * @param {integer} end - pixel to end at
 */
Jimp.prototype.shortsort = function shortsort(dir, start, end, cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data),
	cut, mm;
	if (nullOrUndefined(start) && nullOrUndefined(end)) {
		mm = randMinMax(0, width * height);
		mm = randMinMax2(mm[0], mm[1]);
	} else if(!nullOrUndefined(start) && nullOrUndefined(end)) {
		mm = randMinMax(start, randMinMax2(width * height)[1]);
	} else if(nullOrUndefined(start) && !nullOrUndefined(end)) {
		mm = randMinMax(randMinMax2((width * height) - end)[0], end);
	} else {
		mm = [start, end];
	}
	cut = data.subarray(mm[0], mm[1]);
	dir = nullOrUndefined(dir)? coinToss() : dir;
	if (dir) {
		Array.prototype.sort.call(cut, leftSort);
	} else {
		Array.prototype.sort.call(cut, rightSort);
	}

	this.bitmap.data = new Buffer(data.buffer);
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
		if ("number" != typeof cutstart)
			return throwError.call(this, "cutstart must be a number", cb);
		if (cutstart > 0 && cutstart < cutend)
			return throwError.call(this, "cutstart must be greater than 0 and less than cutend", cb);
	}
	if (!nullOrUndefined(cutend)) {
		if ("number" != typeof cutend)
			return throwError.call(this, "cutend must be a number", cb);
		if (cutend > 0 && cutend > cutstart)
			return throwError.call(this, "cutend must be greater than 0 and greater than cutstart", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data;
	cutend = !nullOrUndefined(cutend) ? cutend : randFloor(width * height * 4);
	cutstart = !nullOrUndefined(cutstart) ? cutstart : Math.floor(cutend / 1.7);
	var cut = data.subarray(cutstart, cutend);
	data.set(cut, randFloor((width * height * 4) - cut.length));
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * slicesort
 * @param {boolean} direction - direction to sort, T/F for Left or Right
 * @param {integer} start - pixel to start at
 * @param {integer} end - pixel to end at
 */
Jimp.prototype.slicesort = function slicesort(dir, start, end, cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	mm,
	data = new Uint32Array(this.bitmap.data);
	dir = nullOrUndefined(dir)? coinToss() : dir;

	if (nullOrUndefined(start) && nullOrUndefined(end)) {
		mm = randMinMax(0, width * height);
		mm = randMinMax2(mm[0], mm[1]);
	} else if(!nullOrUndefined(start) && nullOrUndefined(end)) {
		mm = randMinMax(start, randMinMax2(width * height)[1]);
	} else if(nullOrUndefined(start) && !nullOrUndefined(end)) {
		mm = randMinMax(randMinMax2((width * height) - end)[0], end);
	} else {
		mm = [start, end];
	}

	var cut = data.subarray(mm[0], mm[1]),
	offset = Math.abs(randRound(data.length) - cut.length) % data.length;
	if(dir) {
		Array.prototype.sort.call(cut, leftSort);
	} else {
		Array.prototype.sort.call(cut, rightSort);
	}
	data.set(data.buffer, coinToss() ? offset : mm[0]);

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * sort
 * @param {boolean} direction - T/F for Left or Right
 */
Jimp.prototype.sort = function sort(dir, cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data);
	dir = nullOrUndefined(dir)? coinToss() : dir;

	if (dir) {
		Array.prototype.sort.call(data, leftSort);
	} else {
		Array.prototype.sort.call(data, rightSort);
	}

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};

/**
 * sortRows
 */
Jimp.prototype.sortRows = function sortRows(cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data);

	for (var i = 0, size = data.length + 1; i < size; i += width) {
		var da = data.subarray(i, i + width);
		Array.prototype.sort.call(da, leftSort);
		da.copyWithin(data, i);
	}

	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * sortStripe
 * @param {boolean} direction - pixel to start at
 * @param {integer} start - pixel to start at
 * @param {integer} end - pixel to end at
 */
Jimp.prototype.sortStripe = function sortStripe(dir, start, end, cb) {
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data),
	mm;

	if (nullOrUndefined(start) && nullOrUndefined(end)) {
		mm = randMinMax(0, width * height);
		mm = randMinMax2(mm[0], mm[1]);
	} else if(!nullOrUndefined(start) && nullOrUndefined(end)) {
		mm = randMinMax(start, randMinMax2(width * height)[1]);
	} else if(nullOrUndefined(start) && !nullOrUndefined(end)) {
		mm = randMinMax(randMinMax2((width * height) - end)[0], end);
	} else {
		mm = [start, end];
	}

	for (var i = 0, size = data.length + 1; i < size; i += width) {
		var da = data.subarray(i + mm[0], i + mm[1]);
		Array.prototype.sort.call(da, leftSort);
		da.copyWithin(data, i + mm[0]);
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
		if ("number" != typeof pixelation)
			return throwError.call(this, "pixelation must be a number", cb);
		if (pixelation < 2)
			return throwError.call(this, "pixelation must be greater than 1", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data.buffer);
	pixelation = !nullOrUndefined(pixelation) ? pixelation : randRange(2, 15);
	for (var y = 0; y < height; y += pixelation) {
		for (var x = 0; x < width; x += pixelation) {
			if (coinToss()) {
				var locale = coinToss();
				var mask = randChoice([0x00FF0000, 0x0000FF00, 0x000000FF]);
				var i = coinToss() ? (y * width + x) :
					(y * width + (x - (pixelation * 2)));
				for (var n = 0; n < pixelation; n++) {
					for (var m = 0; m < pixelation; m++) {
						if (x + m < width) {
							var j = ((width * (y + n)) + (x + m));
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
 * Super Shift
 * @param {number} iter - number of times to shift color values
 * @param {boolean} dir - direction to shift colors, true for RGB->GBR, false for RGB->BRG.
 */
Jimp.prototype.superShift = function superShift(iter, dir, cb) {
	if (!nullOrUndefined(iter)) {
		if ("number" != typeof iter)
			return throwError.call(this, "iter must be a number", cb);
		if (iter < 2)
			return throwError.call(this, "iter must be greater than 1", cb);
	}
	if (!nullOrUndefined(dir))
		return throwError.call(this, "dir must be truthy or falsey", cb);
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
 * Super Slice
 * @param {number} iter - Number of times to perform an automatic slice
 */
Jimp.prototype.superSlice = function superSlice(iter, cb) {
	if (!nullOrUndefined(iter)) {
		if ("number" != typeof iter)
			return throwError.call(this, "iter must be a number", cb);
		if (iter > 0)
			return throwError.call(this, "iter must be greater than 0", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = this.bitmap.data,
	cutend, cutstart;
	iter = !nullOrUndefined(iter) ? iter : 3;
	for (var i = 0; i < iter; i++ ) {
		switch (randRange(0,1)) {
			case 0:
				cutend = randFloor(width * height * 4);
				cutstart = Math.floor(cutend / 1.7);
				break;
			case 1:
				cutend = Math.random() < 0.75 ? randFloor(width * height * 4) : (width * height * 4);
				cutstart = Math.floor(cutend / 1.7);
				break;
		}
		var cut = data.subarray(cutstart, cutend);
		data.set(cut, randFloor((width * height * 4) - cut.length));
	}
	this.bitmap.data = new Buffer(data);
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};


/**
 * theworks - run every glitch function on the incoming image
 */
Jimp.prototype.theworks = function (cb) {
	for (var prop in this) {
		if (typeof this[prop] === 'function' &&
				this[prop].name){
			this[prop]();
		}
	}
	if (isNodePattern(cb)) return cb.call(this, null, this);
	else return this;
};



if( typeof module !== 'undefined' && module.exports ) {
	module.exports = Jimp;
}

}).call(this,require("buffer").Buffer)
},{"buffer":3,"jimp":5}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (isArrayBufferView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":2,"ieee754":4}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
(function (Buffer){
/*
Jimp v0.2.28
https://github.com/oliver-moran/jimp
Ported for the Web by Phil Seaton

The MIT License (MIT)

Copyright (c) 2014 Oliver Moran

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var window = window || self;
//    The MIT License (MIT)
//
//    Copyright (c) 2015 Phil Seaton
//
//    Permission is hereby granted, free of charge, to any person obtaining a copy
//    of this software and associated documentation files (the "Software"), to deal
//    in the Software without restriction, including without limitation the rights
//    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//    copies of the Software, and to permit persons to whom the Software is
//    furnished to do so, subject to the following conditions:
//
//    The above copyright notice and this permission notice shall be included in all
//    copies or substantial portions of the Software.
//
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//    SOFTWARE.

if (!self.Buffer && !window.Buffer){
    throw new Error("Node's Buffer() not available");
} else if (!self.Jimp && !window.Jimp) {
    throw new Error("Could not Jimp object");
}

(function(){
    
    function fetchImageDataFromUrl(url, cb) {
        // Fetch image data via xhr. Note that this will not work
        // without cross-domain allow-origin headers because of CORS restrictions
        var xhr = new XMLHttpRequest();
        xhr.open( "GET", url, true );
        xhr.responseType = "arraybuffer";
        xhr.onload = function() {
            if (xhr.status < 400) cb(this.response,null);
            else cb(null,"HTTP Status " + xhr.status + " for url "+url);
        };
        xhr.onerror = function(e){
            cb(null,e);
        };

        xhr.send();
    };
    
    function bufferFromArrayBuffer(arrayBuffer) {
        // Prepare a Buffer object from the arrayBuffer. Necessary in the browser > node conversion,
        // But this function is not useful when running in node directly
        var buffer = new Buffer(arrayBuffer.byteLength);
        var view = new Uint8Array(arrayBuffer);
        for (var i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
        }

        return buffer;
    }
    
    function isArrayBuffer(test) {
        return Object.prototype.toString.call(test).toLowerCase().indexOf("arraybuffer") > -1;
    }

    // delete the write method
    delete Jimp.prototype.write;
    
    // Override the nodejs implementation of Jimp.read()
    delete Jimp.read;
    Jimp.read = function(src, cb) {
        return new Promise(function(resolve, reject) {
                cb = cb || function(err, image) {
                    if (err) reject(err);
                    else resolve(image);
                };

                if ("string" == typeof src) {
                    // Download via xhr
                    fetchImageDataFromUrl(src,function(arrayBuffer,error){
                        if (arrayBuffer) {
                            if (!isArrayBuffer(arrayBuffer)) {
                                cb(new Error("Unrecognized data received for " + src));
                            } else {
                                new Jimp(bufferFromArrayBuffer(arrayBuffer),cb);
                            }
                        } else if (error) {
                            cb(error);
                        }
                    });
                } else if (isArrayBuffer(src)) {
                    // src is an ArrayBuffer already
                    new Jimp(bufferFromArrayBuffer(src), cb);
                } else {
                    // src is not a string or ArrayBuffer
                    cb(new Error("Jimp expects a single ArrayBuffer or image URL"));
                }
        });
    }
    
})();
}).call(this,require("buffer").Buffer)
},{"buffer":3}]},{},[1]);
