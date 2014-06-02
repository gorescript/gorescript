GS.UIComponents.MenuPanel = function(vectorCanvas, offset, pos, size, fontSize, rowHeight) {
	this.cvs = vectorCanvas;

	this.children = [];
	this.fontSize = fontSize || 40;

	this.offset = offset;
	this.pos = pos;
	this.size = size;
	this.rowHeight = rowHeight || 40;
};

GS.UIComponents.MenuPanel.prototype = {
	constructor: GS.UIComponents.MenuPanel,

	init: function() {
	},

	addButton: function(text, onClick) {
		var n = this.children.length;
		var offset = this.offset.clone();
		offset.y += n * this.rowHeight;

		if (Math.abs(offset.y - this.offset.y) > this.size.y) {
			throw "menu panel exceeds height";
		}

		var size = new THREE.Vector2(this.size.x, this.rowHeight);

		var button = new GS.UIComponents.MenuButton(this.cvs, text, offset, this.pos, size, onClick);
		button.fontSize = this.fontSize;

		this.children.push(button);

		return button;
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