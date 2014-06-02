GS.DebugUI = {
	fontSize: 24,
	maxTempLines: 10,
	defaultTimeout: 5000,

	overlayMargin: 10,
	overlayPadding: 5,
	overlayWidth: 0,
	overlayHeight: 0,
	overlayX: 0,
	overlayY: 0,

	staticLines: {},
	tempLines: [],
	valueTracking: {},

	hasChanged: false,

	_visible: false,
	set visible(value) {
		this._visible = value;
		if (!value && this.ctx) {
			this.ctx.clearRect(0, 0, this.width, this.height);
		}
	},

	get visible() {
		return this._visible;
	},

	init: function() {
		var that = this;

		this.width = GS.getViewportWidth();
		this.height = GS.getViewportHeight();

		window.addEventListener("resize", function() { that.onResize(); }, false);

		var canvas = document.createElement("canvas");
		canvas.id = "debug-ui-canvas";
		canvas.width = this.width;
		canvas.height = this.height;
		canvas.style.backgroundColor = "rgba(0, 0, 0, 0)";
		canvas.style.zIndex = 100;
		this.canvas = canvas;

		var ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		ctx.save();
		this.ctx = ctx;
		this.updateFont();
		
		document.body.appendChild(this.canvas);
	},

	update: function() {
		var hasChanged = false;
		var now = new Date();
		for (var i = this.tempLines.length - 1; i >= 0; i--) {
			var line = this.tempLines[i];
			if (line.timeout > 0 && (now - line.startTime > line.timeout)) {
				this.tempLines.splice(i, 1);
				this.hasChanged = true;
			}
		}

		if (this.hasChanged) {
			this.calculateOverlayCoords();
			this.draw();
			this.hasChanged = false;
		}
	},

	draw: function() {
		if (!this._visible) {
			return;
		}

		this.ctx.clearRect(0, 0, this.width, this.height);

		if (Object.keys(this.staticLines).length > 0 || this.tempLines.length > 0) {
			this.ctx.save();

			this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
			this.ctx.fillRect(this.overlayX, this.overlayY, this.overlayWidth, this.overlayHeight);
			this.ctx.fillStyle = "#fff";

			var y = this.overlayY + this.overlayPadding;
			for (var i in this.staticLines) {
				this.ctx.fillText(this.staticLines[i].text, this.overlayX + this.overlayPadding, y);
				y += this.fontSize + this.overlayPadding;
			}

			for (var i = 0; i < this.tempLines.length; i++) {
				this.ctx.fillText(this.tempLines[i].text, this.overlayX + this.overlayPadding, y);
				y += this.fontSize + this.overlayPadding;				
			}

			this.ctx.restore();
		}
	},

	updateFont: function() {
		this.ctx.font = this.fontSize + "px 'Lucida Console', Monaco, monospace";
		this.ctx.textBaseline = "top";
	},

	calculateOverlayCoords: function() {
		this.overlayWidth = 0;
		this.overlayHeight = (Object.keys(this.staticLines).length + this.tempLines.length) * 
			(this.fontSize + this.overlayPadding) + this.overlayPadding;

		// lower right
		// this.overlayX = this.width - this.overlayWidth - this.overlayMargin;
		// this.overlayY = this.height - this.overlayHeight - this.overlayMargin;

		// upper left
		this.overlayX = this.overlayMargin;
		this.overlayY = this.overlayMargin;

		for (var i in this.staticLines) {
			this.overlayWidth = Math.max(this.overlayWidth, this.ctx.measureText(this.staticLines[i].text).width + this.overlayPadding * 2);
		}

		for (var i = 0; i < this.tempLines.length; i++) {
			this.overlayWidth = Math.max(this.overlayWidth, this.ctx.measureText(this.tempLines[i].text).width + this.overlayPadding * 2);
		}
	},

	trackNumericValue: function(id, numericValue) {
		if (this.valueTracking[id] === undefined) {
			this.valueTracking[id] = {};
			this.valueTracking[id].min = Infinity;
			this.valueTracking[id].max = -Infinity;
			this.valueTracking[id].avg = 0;
			this.valueTracking[id].count = 0;
		}

		var v = this.valueTracking[id];
		v.min = Math.min(v.min, numericValue);
		v.max = Math.max(v.max, numericValue);
		v.count++;
		v.avg += (numericValue - v.avg) / v.count;
		this.setStaticLine(id, numericValue + " (min: " + v.min + ", max: " + v.max + ", avg: " + v.avg.toFixed(0) + ")");
	},

	setStaticLine: function(id, text, showId) {
		showId = (showId !== undefined) ? showId : true;
		if (showId) {
			text = id + ": " + text;
		}
		this.staticLines[id] = {
			text: text,
			showId: showId,
		};
		this.hasChanged = true;
	},

	removeStaticLine: function(id) {
		delete this.staticLines[id];
		this.hasChanged = true;
	},

	addTempLine: function(text, timeout) {
		if (this.tempLines.length == this.maxTempLines) {
			this.tempLines.shift();
		}

		timeout = (timeout !== undefined) ? timeout : this.defaultTimeout;
		var line = {
			text: text,
			timeout: timeout,
			startTime: new Date(),
		};
		this.tempLines.push(line);
		this.hasChanged = true;
	},

	onResize: function() {
		this.width = GS.getViewportWidth();
		this.height = GS.getViewportHeight();

		this.canvas.width = this.width;
		this.canvas.height = this.height;

		this.ctx.font = this.fontSize + "px 'Lucida Console', Monaco, monospace";
		this.ctx.textBaseline = "top";
		this.draw();
	},
};