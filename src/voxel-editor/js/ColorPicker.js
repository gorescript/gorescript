GS.ColorPicker = function(container, colors, edgeColors, glows) {
	this.$container = $(container);
	this.colors = colors;
	this.edgeColors = edgeColors;
	this.glows = glows;

	this.columnCount = 4;
	this.selectedIndex = 0;

	this.onSelectedIndexChange = function(e) {};

	this.init();
};

GS.ColorPicker.prototype = {
	constructor: GS.ColorPicker,

	init: function() {
		var that = this;

		this.rowCount = Math.ceil(this.colors.length / this.columnCount);
		var width = this.$container.width();
		if (width % 2 !== 0) {
			width--;
		}
		this.cellSize = width / this.columnCount;
		var height = this.rowCount * this.cellSize;		

		this.addDetail();

		var canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		canvas.style.backgroundColor = "rgba(255, 255, 255, 1)";
		canvas.style.position = "static";
		this.canvas = canvas;
		this.$canvas = $(this.canvas);
		this.$container.append(canvas);

		this.containerOffset = this.$canvas.offset();

		var ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		ctx.save();
		this.ctx = ctx;

		this.selectColor();

		this.draw();
		this.$canvas.css("cursor", "pointer");
		this.$canvas.on("click", function(e) { that.selectColor(e); });
		this.$canvas.on("mousemove", function(e) { that.draw(e); });
		this.$canvas.on("mouseleave", function() { that.draw(); });
	},

	addDetail: function() {
		var that = this;

		var detail = [
			"<div class='menu-label'>Glow</div>",
			"<div class='menu-field'>",
				"<input type='checkbox' class='color-picker-detail-glow'>",
			"</div>",
			"<div class='menu-label'>Edge glow</div>",
			"<div class='menu-field'>",
				"<input type='checkbox' class='color-picker-detail-glow-edge'>",
			"</div>",
			"<div>",
				"<input type='color' style='width: 100%' class='color-picker-detail'><br/>",
				"<input type='color' style='width: 100%; margin-bottom: 5px' class='color-picker-detail-edge'>",
			"</div>",			
		].join("\n");
		this.$container.html(detail);

		this.$detail = $(".color-picker-detail", this.$container);
		this.$detailEdge = $(".color-picker-detail-edge", this.$container);
		this.$glow = $(".color-picker-detail-glow", this.$container);
		this.$glowEdge = $(".color-picker-detail-glow-edge", this.$container);

		this.$detail.on("change", function(e) {
			var color = that.styleToHex($(this).val());
			that.colors[that.selectedIndex] = color;
			that.draw();
			that.dispatchEvent({ type: "colorChange" });
		});

		this.$detailEdge.on("change", function(e) {
			var color = that.styleToHex($(this).val());
			that.edgeColors[that.selectedIndex] = color;
			that.draw();
			that.dispatchEvent({ type: "colorChange" });
		});

		this.$glow.on("change", function(e) {
			that.glows.center[that.selectedIndex] = $(this).is(":checked");
		});

		this.$glowEdge.on("change", function(e) {
			that.glows.edge[that.selectedIndex] = $(this).is(":checked");
		});
	},

	selectColor: function(e) {
		if (e !== undefined) {
			var mx = e.pageX - this.containerOffset.left;
			var my = e.pageY - this.containerOffset.top;
			var x = Math.floor(mx / this.cellSize);
			var y = Math.floor(my / this.cellSize);

			if (y * this.columnCount + x < this.colors.length) {
				this.selectedIndex = y * this.columnCount + x;
				this.onSelectedIndexChange({ index: this.selectedIndex });
			}
		} else {
			this.selectedIndex = 0;
		}

		var i = this.selectedIndex;
		this.$detail.val(this.hexToStyle(this.colors[i]));
		this.$detailEdge.val(this.hexToStyle(this.edgeColors[i]));
		this.$glow.prop("checked", this.glows.center[i]);
		this.$glowEdge.prop("checked", this.glows.edge[i]);
	},

	hexToStyle: function(hex) {
		return ("#" + this.pad(hex.toString(16), 6));
	},

	styleToHex: function(style) {
		style = style.substr(1);
		return parseInt(style, 16);
	},

	pad: function(n, width, z) {
		z = z || "0";
		n = n + "";
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	},

	refresh: function() {
		var i = this.selectedIndex;
		this.$detail.val(this.hexToStyle(this.colors[i]));
		this.$detailEdge.val(this.hexToStyle(this.edgeColors[i]));
		this.$glow.prop("checked", this.glows.center[i]);
		this.$glowEdge.prop("checked", this.glows.edge[i]);
	},

	draw: function(e) {
		this.ctx.save();
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		for (var i = 0; i < this.colors.length; i++) {
			var x = (i % this.columnCount) * this.cellSize;
			var y = Math.floor(i / this.columnCount) * this.cellSize;
			this.ctx.fillStyle = "#" + this.pad(this.colors[i].toString(16), 6);
			this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
			x += this.cellSize * 0.75;
			y += this.cellSize * 0.75;
			this.ctx.fillStyle = "#" + this.pad(this.edgeColors[i].toString(16), 6);
			this.ctx.fillRect(x, y, this.cellSize * 0.25, this.cellSize * 0.25);
		}

		if (e !== undefined) {
			var mx = e.pageX;
			var my = e.pageY;			
			this.drawHover(mx - this.containerOffset.left, my - this.containerOffset.top);
		}

		this.drawSelectedColor();
		this.ctx.restore();
	},

	drawHover: function(mx, my) {
		var x = Math.floor(mx / this.cellSize);
		var y = Math.floor(my / this.cellSize);

		if (y * this.columnCount + x < this.colors.length) {
			x *= this.cellSize;
			y *= this.cellSize;
			this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
			this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
		}
	},

	drawSelectedColor: function() {
		var x = (this.selectedIndex % this.columnCount) * this.cellSize;
		var y = Math.floor(this.selectedIndex / this.columnCount) * this.cellSize;

		this.ctx.strokeStyle = "rgba(0, 0, 0, 1)";
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x + this.cellSize - 1, y);
		this.ctx.lineTo(x + this.cellSize - 1, y + this.cellSize - 1);
		this.ctx.lineTo(x, y + this.cellSize - 1);
		this.ctx.closePath();
		this.ctx.stroke();
	},
};

THREE.EventDispatcher.prototype.apply(GS.ColorPicker.prototype);