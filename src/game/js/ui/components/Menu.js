GS.UIComponents.Menu = function(vectorCanvas, assets) {	
	this.cvs = vectorCanvas;
	this.assets = assets;

	this.fontSize = 60;
	this.boxCornerRadius = 10;

	this.background = {
		offset: new THREE.Vector2(0, 0),
		pos: new THREE.Vector2(0.25, 0.25),
		size: new THREE.Vector2(0.5, 0.5),
	};

	this.text = {
		offset: new THREE.Vector2(0, 0),
		pos: new THREE.Vector2(0.5, 0.5),
	};

	this.visible = true;
};

GS.UIComponents.Menu.prototype = {
	constructor: GS.UIComponents.Menu,

	init: function() {
	},

	update: function() {
	},

	draw: function() {
		this.cvs.roundedBoxFill(this.background.offset, this.background.pos, this.background.size, false, 
				this.boxCornerRadius, GS.UIColors.menuBackground);
		this.cvs.text(this.text.offset, this.text.pos, "paused", 
			GS.UIColors.foreground, this.fontSize, "bottom", "center", GS.UIFont);
		this.cvs.text(this.text.offset, this.text.pos, "[ESC] to unpause", 
			GS.UIColors.foreground, this.fontSize, "top", "center", GS.UIFont);
	},
};