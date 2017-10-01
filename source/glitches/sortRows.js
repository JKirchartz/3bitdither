/**
 * sortRows
 * @param {integer} start - pixel to start at
 * @param {integer} end - pixel to end at
 */
Jimp.prototype.sortRows = function sortRows() {
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

