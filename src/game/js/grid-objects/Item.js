GS.Item = function(grid, layer, sourceObj) {
	GS.GridObject.apply(this, arguments);

	this.size = new THREE.Vector3(5, 5, 5);
	this.scale = new THREE.Vector3(0.4, 0.4, 0.4);
	this.offset = new THREE.Vector3(4, 3, 4);

	this.animation = {
		rotationSpeed: 0.01,
		floatYDelta: 0.25,
		floatAngle: 0,
		floatSpeed: 2,
	};

	this.view = {
		collisionData: {
			boundingBox: new THREE.Box3(),
		}
	};
};

GS.Item.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Item,

	init: function() {
		this.updateBoundingBox();
		this.sector = this.getSector();
		this.getLightColorFromSector(this.view.mesh.material.emissive, this.sector);
	},

	update: function() {
		this.updateLightLevel();

		this.view.mesh.rotation.y += this.animation.rotationSpeed;		
		this.animation.floatAngle += this.animation.floatSpeed;

		var pos = this.view.mesh.position;
		pos.y = this.position.y + this.animation.floatYDelta * Math.sin(Math.PI / 180 * this.animation.floatAngle);
	},

	updateLightLevel: function() {
		this.getLightColorFromSector(this.view.mesh.material.emissive, this.sector);
	},

	updateCollisionData: function(newPos) {
		this.position.copy(newPos);
		this.view.mesh.position.copy(this.position);
		this.updateBoundingBox();
	},

	remove: function() {
		this.grid.removeEntityMesh(this.view.mesh);
		GS.GridObject.prototype.remove.call(this);
	},
});