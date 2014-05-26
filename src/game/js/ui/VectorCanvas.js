GS.VectorCanvas = function(canvas2d) {
	this.cvs = canvas2d;

	this.ratio = new THREE.Vector2();
};

GS.VectorCanvas.prototype = {
	constructor: GS.VectorCanvas,

	init: function() {
		this.onResize();
	},

	onResize: function() {
		this.ratio.set(window.innerWidth, window.innerHeight);
	},

	convertToScreenCoords: function(v0, v, fixedOffset) {
		v.x = Math.floor(v0.x * this.ratio.x);
		v.y = Math.floor(v0.y * this.ratio.y);

		if (fixedOffset !== undefined) {
			v.x += fixedOffset.x;
			v.y += fixedOffset.y;
		}
	},

	line: function() {
		var v0 = new THREE.Vector2();
		var v1 = new THREE.Vector2();

		return function(fixedOffset, pos, lineOffset, isFixedLineOffset, color, lineWidth) {
			this.convertToScreenCoords(pos, v0, fixedOffset);

			if (!isFixedLineOffset) {
				this.convertToScreenCoords(lineOffset, v1);
				v1.add(v0);
			} else {
				v1.copy(v0).add(lineOffset);
			}

			this.cvs.line(v0, v1, color, lineWidth);
		}
	}(),

	box: function() {
		var v0 = new THREE.Vector2();
		var v1 = new THREE.Vector2();

		return function(fixedOffset, pos, size, isFixedSize, color, lineWidth) {
			this.convertToScreenCoords(pos, v0, fixedOffset);

			if (!isFixedSize) {
				this.convertToScreenCoords(size, v1);
				v1.add(v0);
			} else {
				v1.copy(v0).add(size);
			}

			this.cvs.box(v0, v1, color, lineWidth);
		}
	}(),

	boxFill: function() {
		var v0 = new THREE.Vector2();
		var v1 = new THREE.Vector2();

		return function(fixedOffset, pos, size, isFixedSize, color) {
			this.convertToScreenCoords(pos, v0, fixedOffset);

			if (!isFixedSize) {
				this.convertToScreenCoords(size, v1);
				v1.add(v0);
			} else {
				v1.copy(v0).add(size);
			}

			this.cvs.boxFill(v0, v1, color);
		}
	}(),

	circle: function() {
		var v = new THREE.Vector2();

		return function(fixedOffset, pos, radius, color, lineWidth) {
			this.convertToScreenCoords(pos, v, fixedOffset);

			this.cvs.circle(v, radius, color, lineWidth);
		}
	}(),

	circleFill: function() {
		var v = new THREE.Vector2();

		return function(fixedOffset, pos, radius, color) {
			this.convertToScreenCoords(pos, v, fixedOffset);

			this.cvs.circleFill(v, radius, color);
		}
	}(),

	text: function() {
		var v = new THREE.Vector2();

		return function(fixedOffset, pos, str, color, fontSize, textBaseline, textAlign, fontFamily) {
			this.convertToScreenCoords(pos, v, fixedOffset);

			this.cvs.text(v, str, color, fontSize, textBaseline, textAlign, fontFamily);
		}
	}(),

	drawImage: function() {
		var v = new THREE.Vector2();

		return function(fixedOffset, pos, img, atlasOffset, atlasSize) {
			this.convertToScreenCoords(pos, v, fixedOffset);

			this.cvs.drawImage(v, img, atlasOffset, atlasSize);
		}
	}(),

	getTextWidth: function(str, fontSize, fontFamily) {
		return this.cvs.getTextWidth(str, fontSize, fontFamily);
	},

	roundedBox: function() {
		var v0 = new THREE.Vector2();
		var v1 = new THREE.Vector2();

		return function(fixedOffset, pos, size, isFixedSize, radius, color, lineWidth) {
			this.convertToScreenCoords(pos, v0, fixedOffset);

			if (!isFixedSize) {
				this.convertToScreenCoords(size, v1);
				v1.add(v0);
			} else {
				v1.copy(v0).add(size);
			}

			this.cvs.roundedBox(v0, v1, radius, color, lineWidth);
		}
	}(),

	roundedBoxFill: function() {
		var v0 = new THREE.Vector2();
		var v1 = new THREE.Vector2();

		return function(fixedOffset, pos, size, isFixedSize, radius, color, lineWidth) {
			this.convertToScreenCoords(pos, v0, fixedOffset);

			if (!isFixedSize) {
				this.convertToScreenCoords(size, v1);
				v1.add(v0);
			} else {
				v1.copy(v0).add(size);
			}

			this.cvs.roundedBoxFill(v0, v1, radius, color);
		}
	}(),
};