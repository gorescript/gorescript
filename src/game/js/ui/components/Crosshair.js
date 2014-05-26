GS.UIComponents.Crosshair = function(vectorCanvas, assets, player) {
	this.cvs = vectorCanvas;
	this.assets = assets;
	this.player = player;

	this.size = 10;
	this.lineWidth = 3;
	this.pos = new THREE.Vector2(0.5, 0.5);
	this.hOffset = new THREE.Vector2(-this.size, 0);
	this.hLineOffset = new THREE.Vector2(this.size * 2, 0);
	this.vOffset = new THREE.Vector2(0, -this.size);
	this.vLineOffset = new THREE.Vector2(0, this.size * 2);

	this.visible = true;
};

GS.UIComponents.Crosshair.prototype = {
	constructor: GS.UIComponents.Crosshair,

	init: function() {
	},

	update: function() {
	},

	draw: function() {
		this.cvs.line(this.hOffset, this.pos, this.hLineOffset, true, GS.UIColors.foreground, this.lineWidth);
		this.cvs.line(this.vOffset, this.pos, this.vLineOffset, true, GS.UIColors.foreground, this.lineWidth);
	},
};