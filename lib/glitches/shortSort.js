Jimp.prototype.shortsort = function shortsort(cutStart, cutFinish, cb) {
	if(!nullOrUndefined(cutStart)) {
		if (typeof cutStart != 'number')
			return throwError.call(this, "cutStart must be a number", cb);
	}
	if(!nullOrUndefined(cutFinish)) {
		if (typeof cutFinish != 'number')
			return throwError.call(this, "cutFinish must be a number", cb);
	}
	var width = this.bitmap.width,
	height = this.bitmap.height,
	data = new Uint32Array(this.bitmap.data),
	mm = !nullOrUndefined(cutStart) ? cutStart : randMinMax(0, height * width), cut;
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
