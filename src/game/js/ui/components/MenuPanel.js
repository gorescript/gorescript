GS.UIComponents.MenuPanel = function(vectorCanvas, offset, pos, size, fontSize, rowHeight) {
	this.cvs = vectorCanvas;

	this.children = [];
	this.fontSize = fontSize || 40;

	this.offset = offset;
	this.pos = pos;
	this.size = size;
	this.rowHeight = rowHeight || 40;
	this.rowOffset = 0;
};

GS.UIComponents.MenuPanel.prototype = {
	constructor: GS.UIComponents.MenuPanel,

	init: function() {
	},

	addButton: function(text, onClick) {
		var offset = this.getRowOffset();
		var size = new THREE.Vector2(this.size.x, this.rowHeight);

		var button = new GS.UIComponents.MenuButton(this.cvs, text, offset, this.pos, size, onClick);
		button.fontSize = this.fontSize;

		this.children.push(button);

		this.rowOffset += this.rowHeight;

		return button;
	},

	addToggleButton: function(text, states, buttonSize, onClick) {
		buttonSize = buttonSize || 0.2;

		var offset = this.getRowOffset();
		var labelOffset = offset.clone();
		labelOffset.x += this.size.x * 0.5 - 10;
		labelOffset.y += this.rowHeight * 0.5;

		var label = new GS.UIComponents.MenuLabel(this.cvs, text, labelOffset, this.pos);
		label.fontSize = this.fontSize;
		label.textAlign = "right";

		this.children.push(label);

		var buttonOffset = offset.clone();
		var buttonSize = new THREE.Vector2(this.size.x * buttonSize, this.rowHeight);
		buttonOffset.x += this.size.x * 0.5 + 10;

		states = states || ["on", "off"];
		var button = new GS.UIComponents.MenuButton(this.cvs, states[0], buttonOffset, this.pos, buttonSize, onClick, states);
		button.fontSize = this.fontSize;

		this.children.push(button);

		this.rowOffset += this.rowHeight;

		return {
			label: label,
			button: button,
		};
	},

	addDoubleLabel: function(text1, text2) {
		var offset = this.getRowOffset();

		var label1Offset = offset.clone();
		label1Offset.x += this.size.x * 0.5 - 30;
		label1Offset.y += this.rowHeight * 0.5;

		var label1 = new GS.UIComponents.MenuLabel(this.cvs, text1, label1Offset, this.pos);
		label1.fontSize = this.fontSize;
		label1.textAlign = "right";

		this.children.push(label1);

		var label2Offset = offset.clone();
		label2Offset.x += this.size.x * 0.5 + 30;
		label2Offset.y += this.rowHeight * 0.5;

		var label2 = new GS.UIComponents.MenuLabel(this.cvs, text2, label2Offset, this.pos);
		label2.fontSize = this.fontSize;
		label2.textAlign = "left";

		this.children.push(label2);

		this.rowOffset += this.rowHeight;

		return {
			label1: label1,
			label2: label2,
		};
	},

	addNumberPicker: function(text, value, min, max, step, onChange) {
		var offset = this.getRowOffset();
		var labelOffset = offset.clone();
		labelOffset.x += this.size.x * 0.5 - 10;
		labelOffset.y += this.rowHeight * 0.5;

		var label = new GS.UIComponents.MenuLabel(this.cvs, text, labelOffset, this.pos);
		label.fontSize = this.fontSize;
		label.textAlign = "right";

		this.children.push(label);

		var numberPickerOffset = offset.clone();
		var numberPickerSize = new THREE.Vector2(this.size.x * 0.2, this.rowHeight);
		numberPickerOffset.x += this.size.x * 0.5 + 10;
		var numberPicker = new GS.UIComponents.MenuNumberPicker(this.cvs, numberPickerOffset, this.pos, numberPickerSize,
			this.fontSize, value, min, max, step, onChange);

		this.children.push(numberPicker);

		this.rowOffset += this.rowHeight;

		return {
			label: label,
			numberPicker: numberPicker,
		};
	},

	addImageButton: function(text, image, onClick) {
		var offset = this.getRowOffset();
		var imageButtonOffset = offset.clone();
		var imageButtonSize = new THREE.Vector2(this.size.x, this.rowHeight);
		var imageButton = new GS.UIComponents.MenuImageButton(this.cvs, imageButtonOffset, this.pos,
			imageButtonSize, this.fontSize, text, image, onClick);

		this.children.push(imageButton);
		this.rowOffset += this.rowHeight;

		return imageButton;
	},

	addEmptyRow: function() {
		this.rowOffset += this.rowHeight;
	},

	getRowOffset: function() {
		var offset = this.offset.clone();
		offset.y += this.rowOffset;

		if (Math.abs(offset.y - this.offset.y) > this.size.y) {
			GAME.handleFatalError("menu panel exceeds height");
			return;
		}

		return offset;
	},

	update: function() {
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].update();
		}
	},

	draw: function() {
		// this.cvs.boxFill(this.offset, this.pos, this.size, true, "rgba(255, 0, 0, 1)");

		for (var i = 0; i < this.children.length; i++) {
			this.children[i].draw();
		}
	},

	add: function(menuComponent) {
		this.children.push(menuComponent);
	},
};