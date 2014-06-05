GS.UIComponents.MenuNumberPicker = function(vectorCanvas, offset, pos, size, fontSize, value, min, max, step, onChange) {
	this.cvs = vectorCanvas;

	this.fontSize = fontSize || 40;

	this.offset = offset;
	this.pos = pos;
	this.size = size;

	this.value = (value !== undefined) ? value : 5;
	this.min = (min !== undefined) ? min : 1;
	this.max = (max !== undefined) ? max : 10;
	this.step = (step !== undefined) ? step : 1;

	this.onChange = onChange || function() {};

	this.init();
};

GS.UIComponents.MenuNumberPicker.prototype = {
	constructor: GS.UIComponents.MenuNumberPicker,

	init: function() {
		var that = this;
		var size = new THREE.Vector2(this.size.x * 0.2, this.size.y);

		var leftOffset = this.offset.clone();
		this.leftButton = new GS.UIComponents.MenuButton(this.cvs, "<", leftOffset, this.pos, size);
		this.leftButton.fontSize = this.fontSize;
		this.leftButton.onClick = function() {
			that.value -= that.step;
			that.value = Math.max(that.min, that.value);
			that.label.text = that.value;
			that.onChange({ value: that.value });
		};

		var rightOffset = this.offset.clone();
		rightOffset.x += this.size.x * 0.8;
		this.rightButton = new GS.UIComponents.MenuButton(this.cvs, ">", rightOffset, this.pos, size);
		this.rightButton.fontSize = this.fontSize;
		this.rightButton.onClick = function() {
			that.value += that.step;
			that.value = Math.min(that.max, that.value);
			that.label.text = that.value;
			that.onChange({ value: that.value });
		};

		var labelOffset = this.offset.clone();
		labelOffset.x += this.size.x * 0.5;
		labelOffset.y += this.size.y * 0.5;
		this.label = new GS.UIComponents.MenuLabel(this.cvs, this.value, labelOffset, this.pos);
		this.label.fontSize = this.fontSize;
	},

	update: function() {
		this.leftButton.update();
		this.rightButton.update();
	},

	draw: function() {
		this.leftButton.draw();
		this.rightButton.draw();
		this.label.draw();
	},
};