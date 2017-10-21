Glitchy 3 Bit Dither
==============

Mutilate images online with <a href="http://jkirchartz.com/Glitchy3bitdither/GlitchCruiser.html" title="Glitch Cruiser">Glitch Cruiser</a>.

<p>This is a utility to mutilate images in unpredictable ways. It can randomly choose between algorithms, and many algorithms randomly mutate themselves.
    You can choose different encodings, effects, and emulate several glitch techniques, resulting in aleatoric new images and hidden configurations.</p>
</p>
<p>Check out some curated images at <a href="http://glitches.jkirchartz.com/">glitches.jkirchartz.com</a></p>
<p>This runs completely client-side, using the FileReader and canvas APIs, your image isn't being uploaded to any server. If you have a decent browser, this should work. Also, you can right-click and save the result of the processing.</p>
<p>Based on Nolan Caudill's <a href="https://github.com/mncaudill/3bitdither">3bitdither</a></p>
<p>Heavily modified by JKirchartz, <a href="https://github.com/jkirchartz/Glitchy3bitdither">code on github</a></p>
<p>Experimental functions may not be 100% stable, this is a work in progress.</p>

## Sample Code

```javascript
// setup canvas
var canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
var ctx = canvas.getContext('2d');

// draw some red circles with black outlines
for (var i = 0; i < 12; i++) {
    var centerX = Math.floor(Math.random() * 500) + 10;
    var centerY = Math.floor(Math.random() * 500) + 10;
    var radius = Math.floor(Math.random() * 50) + 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#ff0000";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.stroke();
}

// get data
var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
// apply a corruption to an image
ctx.putImageData(glitch(imageData), 0, 0);

// send output to img element on the page
var out = document.createElement('img');
out.src = canvas.toDataURL("image/png");
document.body.appendChild(out);
```

## todo:

1. optimize code w/ better code from the row-sorting algos
2. web workers
3. namespace
4. better function names
5. better comments
7. Add glitches:
  - scan lines (1px black line the entire width every N lines)
  - move each "row" in opposite directions (1px at a time)
  - kaleidoscope
8. nodejs/cli - for batch/bots/etc. (via JIMP)

## Release Notes

v0.1.0 has added glitch functions to jimp, and mostly successfully emulates Glitchy3bitDither in node.js.
There are still some kinks to work out in a few of the glitch functions, use at your own peril.

## Run locally

The demo site in this repo is a [Jekyll](http://jekyllrb.com) project. To run locally install the gem &amp; run `jekyll --serve`.

You can also use the `--auto` flag to make Jekyll automatically update the site as files change.

Portions under the included MIT license, copyright 2013 Matthew Nolan Caudill, as noted.

JIMP (included in the node.js branch) is included under the MIT license (with Open Sans included under the Apache License)

Glitchy3bitDither is presented under the [GPL3.0 license](gpl-3.0.txt), copyleft 2013 JKirchartz, except as noted.


## Development

build with `npm build`

test with `npm test`

manually inspect images output in current directory


# I am open to any and all Pull Requests

please read [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

and... hack away! huzzah!
