GS.UIComponents.MenuPanel = function(vectorCanvas, offset, pos, size, fontSize, rowHeight) {
	this.cvs = vectorCanvas;

	this.children = [];
	this.fontSize = fontSize || 40;

	this.offset = offset;
	this.pos = pos;
	this.size = size;
	this.rowHeight = rowHeight || 40;
	this.rowCount = 0;
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

		this.rowCount++;

		return button;
	},

	addToggleButton: function(text, states, onClick) {
		var offset = this.getRowOffset();
		var labelOffset = offset.clone();
		labelOffset.x += this.size.x * 0.5 - 10;
		labelOffset.y += this.rowHeight * 0.5;

		var label = new GS.UIComponents.MenuLabel(this.cvs, text, labelOffset, this.pos);
		label.fontSize = this.fontSize;
		label.textAlign = "right";

		this.children.push(label);

		var buttonOffset = offset.clone();
		var buttonSize = new THREE.Vector2(this.size.x * 0.2, this.rowHeight);
		buttonOffset.x += this.size.x * 0.5 + 10;

		states = states || ["on", "off"];
		var button = new GS.UIComponents.MenuButton(this.cvs, states[0], buttonOffset, this.pos, buttonSize, onClick, states);
		button.fontSize = this.fontSize;

		this.children.push(button);

		this.rowCount++;

		return {
			label: label,
			button: button,
		};
	},

	addEmptyRow: function() {
		this.rowCount++;
	},

	getRowOffset: function() {
		var offset = this.offset.clone();
		offset.y += this.rowCount * this.rowHeight;

		if (Math.abs(offset.y - this.offset.y) > this.size.y) {
			throw "menu panel exceeds height";
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