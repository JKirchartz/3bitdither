/* TODO: convert to JIMP */
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



