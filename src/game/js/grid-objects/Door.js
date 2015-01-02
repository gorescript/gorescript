GS.DoorStates = {
	Open: 0,
	Closed: 1,
	Opening: 2,
	Closing: 3,	
};

GS.Door = function(grid, sector) {
	GS.GridObject.call(this, grid);

	this.sector = sector;
	this.sector.doorGridObject = this;
	this.lightColor = new THREE.Color();

	this.speed = 0.5;
	this.state = GS.DoorStates.Closed;
	this.automatic = true;

	this.view = {
		collisionData: {
			boundingBox: new THREE.Box3(),
			triangles: null,
			segments: null,
		},
	};

	this.maxCooldown = GS.msToFrames(5000);
	this.cooldown = this.maxCooldown;
};

GS.Door.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Door,

	init: function() {
		this.closedY = this.position.y;
		this.openY = this.closedY + this.sector.doorMaxHeight;
		this.usable = true;

		this.updateBoundingBox();
	},

	update: function() {
		var velocity = new THREE.Vector3();

		switch (this.state) {
			case GS.DoorStates.Open:
				if (this.automatic) {
					this.cooldown--;
					if (this.cooldown <= 0) {
						this.cooldown = this.maxCooldown;
						this.state = GS.DoorStates.Closing;
						this.grid.soundManager.playSound("door_close");
					}
				} else {
					this.cooldown = this.maxCooldown;
				}
				break;

			case GS.DoorStates.Closed:
				break;

			case GS.DoorStates.Opening:
				this.position.y += this.speed;
				velocity.y = this.speed;
				if (this.position.y >= this.openY) {
					this.position.y = this.openY;
					this.state = GS.DoorStates.Open;
				}
				break;

			case GS.DoorStates.Closing:
				if (!this.grid.collisionManager.isEntityNearDoor(this)) {
					this.position.y -= this.speed;
					velocity.y = -this.speed;
					if (this.position.y <= this.closedY) {
						this.position.y = this.closedY;
						this.state = GS.DoorStates.Closed;
					}
				} else {
					this.sector.doorOpenedEver = true;
					this.state = GS.DoorStates.Opening;
				}
				break;
		}

		this.usable = (this.state === GS.DoorStates.Closed && this._automatic === true);

		if (velocity.y !== 0) {
			this.updateBoundingBox();
			this.updateTriangles(velocity);
			this.updateSegments(velocity.y);
			this.updateMesh();
		}

		if (!this.sector.useVertexColors) {
			this.getLightColorFromSector(this.lightColor, this.sector);
			for (var i = 0; i < this.view.mesh.children.length; i++) {
				var material = this.view.mesh.children[i].material;
				if (material.emissive !== undefined) {
					material.emissive.copy(this.lightColor);
				}
			}
		}
	},

	updateMesh: function() {
		for (var i = 0; i < this.view.mesh.children.length; i++) {
			this.view.mesh.children[i].position.copy(this.position);
		}
	},

	onUse: function() {
		if (this.state == GS.DoorStates.Closed) {
			this.sector.doorOpenedEver = true;
			this.state = GS.DoorStates.Opening;
			this.grid.soundManager.playSound("door_open");
			this.grid.aiManager.onPlayerOpenDoor(this);
		}
	},

	open: function() {
		this.sector.doorOpenedEver = true;
		this.state = GS.DoorStates.Opening;
		this.grid.soundManager.playSound("door_open");

		return this;
	},

	openSilent: function() {
		this.sector.doorOpenedEver = true;
		this.state = GS.DoorStates.Opening;

		return this;
	},

	close: function() {
		this.state = GS.DoorStates.Closing;
		this.grid.soundManager.playSound("door_close");

		return this;
	},

	set automatic(value) {
		this._automatic = value;
		this.usable = (this._automatic === true);
	},

	get automatic() {
		return this._automatic;
	},
});