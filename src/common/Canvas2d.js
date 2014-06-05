GS.Canvas2d = function(hideOnStart) {
	this.canvasId = "canvas2d";
	this.hideOnStart = (hideOnStart !== undefined) ? hideOnStart : false;

	this.minWidth = 1280;
	this.minHeight = 720;

	this.alpha = 1;
	this.redrawOnResize = true;
};

GS.Canvas2d.prototype = {
	constructor: GS.Canvas2d,

	init: function() {
		var that = this;

		var screenCanvas = document.createElement("canvas");
		screenCanvas.width = window.innerWidth;
		screenCanvas.height = window.innerHeight;
		screenCanvas.style.backgroundColor = "rgba(0, 0, 0, " + this.alpha + ")";
		screenCanvas.id = this.canvasId;
		this.screenCanvas = screenCanvas;

		if (this.hideOnStart) {
			this.hide();
		}

		document.body.appendChild(this.screenCanvas);

		var screenCtx = screenCanvas.getContext("2d");
		screenCtx.globalCompositeOperation = "source-over";
		screenCtx.save();
		this.screenCtx = screenCtx;

		var bufferCanvas = document.createElement("canvas");
		bufferCanvas.width = window.innerWidth;
		bufferCanvas.height = window.innerHeight;
		bufferCanvas.style.backgroundColor = "rgba(0, 0, 0, 1)";
		this.bufferCanvas = bufferCanvas;

		var bufferCtx = bufferCanvas.getContext("2d");
		bufferCtx.globalCompositeOperation = "source-over";
		bufferCtx.save();
		this.bufferCtx = bufferCtx;

		$(window).on("resize." + this.canvasId, function() { that.onResize(); });
		this.onResize();
	},

	show: function() {
		this.screenCanvas.style.display = "";
	},

	hide: function() {
		this.screenCanvas.style.display = "none";
	},

	clear: function() {
		this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
	},

	flip: function() {
		this.screenCtx.clearRect(0, 0, this.screenCanvas.width, this.screenCanvas.height);
		this.screenCtx.drawImage(this.bufferCanvas, 0, 0);
	},

	line: function(p0, p1, color, lineWidth) {
		color = (color !== undefined) ? color : "#fff";
		lineWidth = lineWidth || 3;

		this.bufferCtx.save();

		this.bufferCtx.strokeStyle = color;
		this.bufferCtx.lineWidth = lineWidth;
		this.bufferCtx.beginPath();
		this.bufferCtx.moveTo(p0.x, p0.y);
		this.bufferCtx.lineTo(p1.x, p1.y);
		this.bufferCtx.closePath();
		this.bufferCtx.stroke();

		this.bufferCtx.restore();
	},

	box: function(p0, p1, color, lineWidth) {
		color = (color !== undefined) ? color : "#fff";
		lineWidth = lineWidth || 3;

		this.bufferCtx.save();

		this.bufferCtx.strokeStyle = color;
		this.bufferCtx.lineWidth = lineWidth;
		this.bufferCtx.beginPath();
		this.bufferCtx.moveTo(p0.x, p0.y);
		this.bufferCtx.lineTo(p1.x, p0.y);
		this.bufferCtx.lineTo(p1.x, p1.y);
		this.bufferCtx.lineTo(p0.x, p1.y);
		this.bufferCtx.closePath();
		this.bufferCtx.stroke();

		this.bufferCtx.restore();
	},

	boxFill: function(p0, p1, color) {
		color = (color !== undefined) ? color : "#fff";

		var x0 = Math.min(p0.x, p1.x);
		var y0 = Math.min(p0.y, p1.y);
		var x1 = Math.max(p0.x, p1.x);
		var y1 = Math.max(p0.y, p1.y);
		var w = x1 - x0;
		var h = y1 - y0;

		this.bufferCtx.save();

		this.bufferCtx.fillStyle = color;
		this.bufferCtx.fillRect(x0, y0, w, h);

		this.bufferCtx.restore();
	},

	_roundedBox: function(p0, p1, radius, filled, color, lineWidth) {
		color = (color !== undefined) ? color : "#fff";
		lineWidth = lineWidth || 3;

		var x0 = Math.min(p0.x, p1.x);
		var y0 = Math.min(p0.y, p1.y);
		var x1 = Math.max(p0.x, p1.x);
		var y1 = Math.max(p0.y, p1.y);

		this.bufferCtx.save();

		if (filled) {
			this.bufferCtx.fillStyle = color;
		} else {
			this.bufferCtx.strokeStyle = color;
			this.bufferCtx.lineWidth = lineWidth;
		}

		this.bufferCtx.beginPath();
		this.bufferCtx.moveTo(x0, y0 + radius);
		this.bufferCtx.lineTo(x0, y1 - radius);
		this.bufferCtx.quadraticCurveTo(x0, y1, x0 + radius, y1);
		this.bufferCtx.lineTo(x1 - radius, y1);
		this.bufferCtx.quadraticCurveTo(x1, y1, x1, y1 - radius);
		this.bufferCtx.lineTo(x1, y0 + radius);
		this.bufferCtx.quadraticCurveTo(x1, y0, x1 - radius, y0);
		this.bufferCtx.lineTo(x0 + radius, y0);
		this.bufferCtx.quadraticCurveTo(x0, y0, x0, y0 + radius);
		this.bufferCtx.closePath();

		if (filled) {
			this.bufferCtx.fill();
		} else {
			this.bufferCtx.stroke();
		}

		this.bufferCtx.restore();
	},

	roundedBox: function(p0, p1, radius, color, lineWidth) {
		this._roundedBox(p0, p1, radius, false, color, lineWidth);
	},

	roundedBoxFill: function(p0, p1, radius, color) {
		this._roundedBox(p0, p1, radius, true, color);
	},

	polygon: function(points, color, lineWidth) {
		color = (color !== undefined) ? color : "#fff";
		lineWidth = lineWidth || 3;

		this.bufferCtx.save();

		this.bufferCtx.strokeStyle = color;
		this.bufferCtx.lineWidth = lineWidth;
		this.bufferCtx.beginPath();
		this.bufferCtx.moveTo(points[0].x, points[0].y);
		for (var i = 1; i < points.length; i++) {
			this.bufferCtx.lineTo(points[i].x, points[i].y);
		}
		this.bufferCtx.closePath();
		this.bufferCtx.stroke();

		this.bufferCtx.restore();
	},

	polygonFill: function(points, color) {
		color = (color !== undefined) ? color : "#fff";

		this.bufferCtx.save();

		this.bufferCtx.fillStyle = color;
		this.bufferCtx.beginPath();
		this.bufferCtx.moveTo(points[0].x, points[0].y);
		for (var i = 1; i < points.length; i++) {
			this.bufferCtx.lineTo(points[i].x, points[i].y);
		}
		this.bufferCtx.closePath();
		this.bufferCtx.fill();

		this.bufferCtx.restore();
	},

	circle: function(pos, radius, color, lineWidth) {
		color = (color !== undefined) ? color : "#fff";
		lineWidth = lineWidth || 3;

		this.bufferCtx.save();

		this.bufferCtx.beginPath();
		this.bufferCtx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
		this.bufferCtx.strokeStyle = color;
		this.bufferCtx.lineWidth = lineWidth;
		this.bufferCtx.stroke();

		this.bufferCtx.restore();
	},

	circleFill: function(pos, radius, color) {
		color = (color !== undefined) ? color : "#fff";

		this.bufferCtx.save();

		this.bufferCtx.beginPath();
		this.bufferCtx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
		this.bufferCtx.fillStyle = color;
		this.bufferCtx.fill();

		this.bufferCtx.restore();
	},

	text: function(pos, str, color, fontSize, textBaseline, textAlign, fontFamily) {
		color = (color !== undefined) ? color : "#fff";
		fontSize = (fontSize !== undefined) ? fontSize : 16;
		textBaseline = textBaseline || "top";
		textAlign = textAlign || "left";
		fontFamily = fontFamily || "'Lucida Console', Monaco, monospace";

		this.bufferCtx.save();

		var offset = GS.isFirefox ? 4 : 0; // remove once https://bugzilla.mozilla.org/show_bug.cgi?id=737852 is fixed

		this.bufferCtx.textBaseline = textBaseline;
		this.bufferCtx.textAlign = textAlign;
		this.bufferCtx.font = fontSize + "px " + fontFamily;
		this.bufferCtx.fillStyle = color;
		this.bufferCtx.fillText(str, pos.x, pos.y + offset);

		this.bufferCtx.restore();
	},

	drawImage: function(pos, img, size) {
		this.bufferCtx.drawImage(img, pos.x, pos.y, size.x, size.y);
	},

	drawImageFromAtlas: function(pos, img, atlasOffset, atlasSize) {
		this.bufferCtx.drawImage(img, atlasOffset.x, atlasOffset.y, atlasSize.x, atlasSize.y, pos.x, pos.y, atlasSize.x, atlasSize.y);
	},

	getTextWidth: function(str, fontSize, fontFamily) {
		fontSize = (fontSize !== undefined) ? fontSize : 16;
		fontFamily = fontFamily || "'Lucida Console', Monaco, monospace";

		this.bufferCtx.save();

		this.bufferCtx.font = fontSize + "px '" + fontFamily + "'";
		var width = this.bufferCtx.measureText(str).width;

		this.bufferCtx.restore();

		return width;
	},

	onResize: function() {
		var canvas;
		if (this.redrawOnResize) {
			canvas = this.clone();
		}

		this.screenCanvas.width = Math.max(window.innerWidth, this.minWidth);
		this.screenCanvas.height = Math.max(window.innerHeight, this.minHeight);
		this.bufferCanvas.width = Math.max(window.innerWidth, this.minWidth);
		this.bufferCanvas.height = Math.max(window.innerHeight, this.minHeight);

		$(this.screenCanvas).css("width", window.innerWidth + "px").css("height", window.innerHeight + "px");

		if (this.redrawOnResize) {
			this.screenCtx.drawImage(canvas, 0, 0);
		}
	},

	clone: function() {
		var canvas = document.createElement("canvas");
		canvas.width = this.screenCanvas.width;
		canvas.height = this.screenCanvas.height;

		var ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		ctx.save();

		ctx.drawImage(this.screenCanvas, 0, 0);

		return canvas;
	},

	dispose: function() {
		$(window).off("resize." + this.canvasId);
		$("#" + this.canvasId).remove();
	},
};
