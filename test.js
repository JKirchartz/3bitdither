/*
 * test.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Distributed under terms of the GPL 3.0 (General Public License) license.
 */

'use strict';
var gleech = require('./dist/gleech.js');

var toTest = ['pixelFunk', 'superPixelFunk', 'shortsort', 'shortdumbsort',
		'sort', 'slicesort', 'sortStripe', 'sortRows', 'randomSortRows',
		'dumbSortRows', 'pixelSort', 'randomGlitch', 'glitch', 'preset1',
		'preset2', 'preset3', 'preset4', 'focusImage', 'rgb_glitch', 'invert',
		'slice', 'slice2', 'slice3', 'scanlines', 'fractalGhosts',
		'fractalGhosts2', 'fractalGhosts3', 'fractalGhosts4', 'fractal',
		'fractal2', 'DrumrollHorizontal', 'DrumrollVertical',
		'DrumrollHorizontalWave', 'DrumrollVerticalWave', 'ditherBitmask',
		'colorShift', 'colorShift2', 'ditherRandom', 'ditherRandom3',
		'ditherBayer', 'ditherBayer3', 'redShift', 'greenShift', 'blueShift',
		'superShift', 'superSlice', 'superSlice2', 'ditherAtkinsons',
		'ditherFloydSteinberg', 'ditherHalftone', 'dither8Bit'];

gleech.read('./test.jpg', function (err, img) {
	if (err) { throw new Error(err); }
	for (var i = 0; i < toTest.length; i += 1) {
		img[toTest[i]]().write('test_'+toTest[i]+'.jpg');
	}
});

