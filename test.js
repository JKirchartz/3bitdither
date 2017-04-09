/*
 * test.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Distributed under terms of the NPL (Necessary Public License) license.
 */
var gleech = require("./gleech.js");

gleech.read("test.jpg", function (err, img) {
        if (err) throw err;
        // one test per function
        img.dither8Bit().write("test_dither8Bit.jpg");
        img.ditherHalftone().write("test_ditherHalftone.jpg");
        img.ditherAtkinsons().write("test_ditherAtkinsons.jpg");
        img.ditherFloydSteinberg().write("test_ditherFloydSteinberg.jpg");
        img.ditherBayer().write("test_ditherBayer.jpg");
        img.ditherBayer3().write("test_ditherBayer3.jpg");
        img.ditherRandom().write("test_ditherRandom.jpg");
        img.ditherBitmask().write("test_ditherBitmask.jpg");
        img.colorShift().write("test_colorShift.jpg");
        img.colorShift2().write("test_colorShift2.jpg");
        img.greenShift().write("test_greenShift.jpg");
        img.redShift().write("test_redShift.jpg");
        img.blueShift().write("test_blueShift.jpg");
        img.superShift().write("test_superShift.jpg");
});
