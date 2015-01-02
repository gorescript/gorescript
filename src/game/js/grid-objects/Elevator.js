GS.ElevatorStates = {
	Down: 0,
	Up: 1,
	GoindDown: 2,
	GoingUp: 3,	
};

GS.Elevator = function(grid, sector) {	
	GS.GridObject.call(this, grid);

	this.sector = sector;
	this.speed = 0.25;
	this.state = GS.ElevatorStates.Down;
	this.automatic = true;
	this.lightColor = new THREE.Color();

	this.view = {
		collisionData: {
			boundingBox: new THREE.Box3(),
			triangles: null,
			segments: null,
		},
	};

	this.maxCooldown = GS.msToFrames(0);
	this.cooldown = this.maxCooldown;

	this.velocity = new THREE.Vector3();
};

GS.Elevator.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Elevator,

	init: function() {
		this.downY = this.position.y;
		this.upY = this.downY + this.sector.elevatorMaxHeight;

		this.updateBoundingBox();
	},

	update: function() {
		this.velocity.set(0, 0, 0);
		var oldY = 0;
		
		switch (this.state) {
			case GS.ElevatorStates.Down:
				if (this.automatic) {
					this.cooldown--;
					if (this.cooldown <= 0) {
						this.cooldown = this.maxCooldown;
						this.state = GS.ElevatorStates.GoingUp;
					}
				}
				break;

			case GS.ElevatorStates.Up:
				if (this.automatic) {
					this.cooldown--;
					if (this.cooldown <= 0) {
						this.cooldown = this.maxCooldown;
						this.state = GS.ElevatorStates.GoingDown;
					}
				}
				break;

			case GS.ElevatorStates.GoingDown:
				oldY = this.position.y;
				this.position.y -= this.speed;
				if (this.position.y <= this.downY) {
					this.position.y = this.downY;
					this.velocity.y = this.downY - oldY;
					this.state = GS.ElevatorStates.Down;
					this.grid.soundManager.playSound("elevator_stop");
				} else {
					this.velocity.y = -this.speed;
				}
				break;

			case GS.ElevatorStates.GoingUp:
				oldY = this.position.y;
				this.position.y += this.speed;
				if (this.position.y >= this.upY) {
					this.position.y = this.upY;
					this.velocity.y = this.upY - oldY;
					this.state = GS.ElevatorStates.Up;
					this.grid.soundManager.playSound("elevator_stop");
				} else {
					this.velocity.y = this.speed;
				}
				break;
		}

		this.updateChange();
	},

	updateChange: function() {
		if (this.velocity.y !== 0) {
			this.updateBoundingBox();
			this.updateTriangles(this.velocity);
			this.updateSegments(this.velocity.y);
			this.updateSector(this.velocity.y);
			this.updateMesh();

			this.grid.collisionManager.elevatorMove(this, this.velocity.y);
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

	updateSector: function(yVelocity) {
		this.sector.floorTopY += yVelocity;
		this.sector.ceilBottomY += yVelocity;
	},

	setPositionUp: function() {
		this.velocity.y = this.upY - this.position.y;
		this.position.y = this.upY;
		this.state = GS.ElevatorStates.Up;

		this.updateChange();

		return this;
	},

	setPositionDown: function() {
		this.velocity.y = this.downY - this.position.y;
		this.position.y = this.downY;
		this.state = GS.ElevatorStates.Down;

		this.updateChange();

		return this;
	},

	goDown: function() {
		this.state = GS.ElevatorStates.GoingDown;
		this.grid.soundManager.playSound("elevator_move");

		return this;
	},

	goUp: function() {
		this.state = GS.ElevatorStates.GoingUp;
		this.grid.soundManager.playSound("elevator_move");

		return this;
	},

	updateMesh: function() {
		for (var i = 0; i < this.view.mesh.children.length; i++) {
			this.view.mesh.children[i].position.copy(this.position);
		}
	},

	onUse: function() {
		if (this.state == GS.ElevatorStates.Closed) {
			this.state = GS.ElevatorStates.Opening;
		}
	},
});