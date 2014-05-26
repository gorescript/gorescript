GS.Switch = function(grid, seg) {
	GS.GridObject.call(this, grid);

	this.segment = seg;
	this.on = false;
	this.usable = true;

	this.view = {
		collisionData: {
			boundingBox: new THREE.Box3(),
		},
	};
};

GS.Switch.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Switch,

	init: function() {
	},

	onUse: function() {
		this.on = true;
		this.view.mesh.material.map = this.view.textureOn;
		this.usable = false;
		this.grid.aiManager.onSwitchStateChange(this);
		this.grid.soundManager.playSound("switch_on");
	},
});