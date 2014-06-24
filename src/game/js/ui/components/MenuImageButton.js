GS.UIComponents.MenuImageButton = function(vectorCanvas, offset, pos, size, fontSize, text, image, onClick) {
	this.cvs = vectorCanvas;

	this.fontSize = fontSize || 40;

	this.offset = offset;
	this.pos = pos;
	this.size = size;
	this.text = text;
	this.image = image;
	this.onClick = onClick || function() {};

	this.init();
};

GS.UIComponents.MenuImageButton.prototype = {
	constructor: GS.UIComponents.MenuImageButton,

	init: function() {
		var that = this;

		var buttonOffset = this.offset.clone();
		var buttonSize = new THREE.Vector2(this.size.x, this.size.y);

		var button = new GS.UIComponents.MenuButton(this.cvs, this.text, buttonOffset, this.pos, buttonSize, function() {
			that.onClick();
		});
		button.textOffset.x -= this.size.x * 0.1;
		button.textAlign = "left";
		button.fontSize = this.fontSize;

		this.button = button;

		this.imageSize = new THREE.Vector2(231, 130);
		this.imageOffset = this.offset.clone();
		this.imageOffset.x += this.size.x * 0.2 - this.imageSize.x / 2;
		this.imageOffset.y += this.size.y * 0.5 - this.imageSize.y / 2;
	},

	update: function() {
		this.button.update();
	},

	draw: function() {
		this.button.draw();
		this.cvs.drawImage(this.imageOffset, this.pos, this.image, this.imageSize, true);
	},
};