GS.Projectile = function(grid, sourceGridObject, type, position, direction) {
	GS.GridObject.call(this, grid);

	$.extend(true, this, GS.Projectiles[type]);

	this.sourceGridObject = sourceGridObject;
	this.type = type;
	this.position = position;
	this.direction = direction;

	this.steps = 0;
	this.maxSteps = Math.floor(this.maxDistance / this.speed);

	this.view = {
		collisionData: {
			boundingBox: new THREE.Box3(),
			ellipsoid: this.size,
		},
	};
};

GS.Projectile.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Projectile,

	init: function() {
		var that = this;

		this.updateBoundingBox();

		this.particle = this.grid.particleView.addParticle(this.visualSize.x, this.visualSize.y, this.visualSize.z, this.color);

		this.view.mesh = this.particle.mesh;
		this.view.mesh.lookAt(this.direction);
		this.view.mesh.visible = false;
		//this.view.mesh.rotation.z = Math.random() * Math.PI;

		var points = [
			new THREE.Vector2(this.position.x - this.size.x, this.position.z - this.size.z),
			new THREE.Vector2(this.position.x + this.size.x, this.position.z + this.size.z),
		];
		var gridLocation = this.grid.getGridLocationFromPoints(points);
		this.assignToCells(gridLocation);
	},

	update: function() {
		this.steps++;

		var newPos = this.position.clone().add(this.direction.clone().multiplyScalar(this.speed));
		this.grid.collisionManager.collideProjectile(this, this.position, newPos);

		this.view.mesh.position.copy(this.position);

		if (this.rotating) {
			this.view.mesh.rotation.x += 0.1;
			this.view.mesh.rotation.y += 0.1;
		}

		if (this.steps > this.maxSteps || this.linkedGridCells.length === 0) {
			this.remove();
		}
	},

	updateCollisionData: function(newPos) {
		this.distanceTravelled += newPos.distanceTo(this.position);

		if (this.steps > 1) {
			this.view.mesh.visible = true;
		}

		this.position.copy(newPos);
		this.updateBoundingBox();
	},

	onHit: function() {
		this.grid.soundManager.playSound(this.hitSound);
		this.remove();
	},

	remove: function() {
		this.particle.toBeRemoved = true;
		GS.GridObject.prototype.remove.call(this);
	},
});