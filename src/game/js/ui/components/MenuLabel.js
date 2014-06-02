GS.UIComponents.MenuLabel = function(vectorCanvas, text, offset, pos) {
	this.cvs = vectorCanvas;

	this.fontSize = 40;
	this.text = text;
	this.textBaseline = "middle";
	this.textAlign = "center";

	this.offset = offset;
	this.pos = pos;

	this.foregroundColor = GS.UIColors.foreground;
};

GS.UIComponents.MenuLabel.prototype = {
	constructor: GS.UIComponents.MenuLabel,

	init: function() {
	},

	update: function() {
	},

	draw: function() {
		this.cvs.text(this.offset, this.pos, this.text, this.foregroundColor, this.fontSize, this.textBaseline, this.textAlign, GS.UIFont);
	},
};