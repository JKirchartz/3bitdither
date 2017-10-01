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
                mm = randMinMax(0, imageData.width * imageData.height);
                mm = randMinMax2(mm[0], mm[1]);
        } else if(!nullOrUndefined(start) && nullOrUndefined(end)) {
                mm = randMinMax(start, randMinMax2(width * height)[1]);
        } else if(nullOrUndefined(start) && !nullOrUndefined(end)) {
                mm = randMinMax(randMinMax2((width * height) - end)[0], end);
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
