/*
 * test.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Distributed under terms of the GPL 3.0 (General Public License) license.
 */
var gleech = require("./dist/gleech.js");

// one test per function
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.dither8Bit().write("test_dither8Bit.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.ditherHalftone().write("test_ditherHalftone.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.ditherAtkinsons().write("test_ditherAtkinsons.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.ditherFloydSteinberg().write("test_ditherFloydSteinberg.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.ditherBayer().write("test_ditherBayer.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.ditherBayer3().write("test_ditherBayer3.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.ditherRandom().write("test_ditherRandom.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.ditherBitmask().write("test_ditherBitmask.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.colorShift().write("test_colorShift.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.rgbShift().write("test_rgbShift.jpg");
});
// gleech.read("./test.jpg", function (err, img) {
////         if (err) throw (err);
//         img.colorShift2().write("test_colorShift2.jpg");
// });
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.greenShift().write("test_greenShift.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.redShift().write("test_redShift.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.blueShift().write("test_blueShift.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.superShift().write("test_superShift.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.superPixelFunk().write("test_superPixelFunk.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.pixelFunk().write("test_pixelFunk.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.focusImage().write("test_focusImage.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.slice().write("test_slice.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.selectSlice().write("test_selectSlice.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.superSlice().write("test_superSlice.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.fractalGhosts().write("test_fractalGhosts.jpg");
});
gleech.read("./test.jpg", function (err, img) {
        //if (err) throw (err);
        img.fractal().write("test_fractal.jpg");
});
