GS.ParticleMovementTypes = {
	Static: 0,
	Falling: 1,
	Gushing: 2,
};

GS.ParticleView = function(grid) {
	this.grid = grid;
	this.scene = grid.scene;

	this.particles = [];
	this.geometries = {};
	this.materials = {};

	this.particleSpeed = 0.00075;
	this.particleGravity = new THREE.Vector3(0, -0.003, 0);
};

GS.ParticleView.prototype = {
	constructor: GS.ParticleView,

	init: function() {
		this.root = new THREE.Object3D();
		this.root.userData = "particle root";
		this.scene.add(this.root);
	},

	update: function() {
		// GS.DebugUI.trackNumericValue("particles", this.particles.length);

		for (var i = 0; i < this.particles.length; i++) {
			var particle = this.particles[i];

			if (particle.movementType != GS.ParticleMovementTypes.Static) {
				if (particle.landed !== true) {
					particle.acceleration.add(particle.gravity);
					particle.velocity.add(particle.acceleration);
					particle.mesh.position.add(particle.velocity);
					particle.mesh.rotation.y += particle.rotationSpeed;
					particle.life++;

					if (particle.floorImpactY !== undefined && particle.mesh.position.y < particle.floorImpactY) {
						particle.mesh.position.y = particle.floorImpactY + 0.5;
						particle.landed = true;
					}
				} else {
					particle.decayTime -= 0.01;
					particle.mesh.scale.set(particle.decayTime, particle.decayTime, particle.decayTime);
					if (particle.decayTime <= 0) {
						particle.toBeRemoved = true;
					}
				}
			}
		}

		for (var i = this.particles.length - 1; i >= 0; i--) {
			if (this.particles[i].toBeRemoved) {
				this.removeParticle(this.particles[i], i);
			}
		}
	},

	addParticle: function(width, height, depth, color, movementType, position) {
		var geometry = this.getGeometry(width, height, depth);
		var material = this.getMaterial(color);
		var mesh = new THREE.Mesh(geometry, material);

		movementType = (movementType !== undefined) ? movementType : GS.ParticleMovementTypes.Static;

		var particle = {
			mesh: mesh,
			position: position,
			rotationSpeed: Math.random() * 0.25,
			movementType: movementType,
			color: color,
			decayTime: 1,
		};

		if (movementType != GS.ParticleMovementTypes.Static) {
			particle.gravity = this.particleGravity.clone();

			if (movementType == GS.ParticleMovementTypes.Falling) {
				particle.horizontalSpeed = 15;
				particle.verticalSpeed = Math.random() * 10;
			} else
			if (movementType == GS.ParticleMovementTypes.Gushing) {
				particle.horizontalSpeed = 20;
				particle.verticalSpeed = Math.random() * 10 + 60;
			}

			this.calculateAcceleration(particle);		
			
			particle.velocity = new THREE.Vector3();

			this.calculateFloorImpactY(particle);
		}

		this.root.add(mesh);
		this.particles.push(particle);

		return particle;
	},

	removeParticle: function(particle, index) {
		var i = (index !== undefined) ? index : this.particles.indexOf(particle);
		if (i > -1) {
			this.root.remove(particle.mesh);
			this.particles.splice(i, 1);
		}
	},

	calculateFloorImpactY: function() {
		var fauxGridObject = {
			grid: null,
			position: new THREE.Vector3(),
			linkedGridCells: null,
		};
		var position2d = new THREE.Vector2();

		return function(particle) {
			particle.position.toVector2(position2d);
			var gridLocation = this.grid.getGridLocationFromPoints([position2d]);

			if (gridLocation !== undefined) {
				fauxGridObject.grid = this.grid;
				fauxGridObject.position.copy(particle.position);
				fauxGridObject.linkedGridCells = this.grid.getCellsFromGridLocation(gridLocation);

				var sector = GS.GridObject.prototype.getSector.call(fauxGridObject);
				if (sector !== undefined) {
					particle.floorImpactY = sector.floorTopY;
				}

				fauxGridObject.grid = null;
				fauxGridObject.linkedGridCells = null;
			}
		}
	}(),

	calculateAcceleration: function(particle) {
		particle.acceleration = new THREE.Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1);
		particle.acceleration.normalize();
		particle.acceleration.multiplyScalar(particle.horizontalSpeed);
		particle.acceleration.y = particle.verticalSpeed;
		particle.acceleration.multiplyScalar(this.particleSpeed);
	},

	alignParticleTrajectoryToNormal: function() {
		var normal2d = new THREE.Vector2();
		var axis = new THREE.Vector2(1, 0);

		return function(particle, normal) {
			if (normal.x == 0 && normal.z == 0) {
				if (normal.y == -1) {
					return;
				}

				particle.horizontalSpeed = 20;
				particle.verticalSpeed = Math.random() * 10 + 30;

				this.calculateAcceleration(particle);

				// this.grid.addDebugLine(particle.position.clone(), 
				// particle.position.clone().add(particle.acceleration.clone().normalize().multiplyScalar(5)), 0x0080ff);

				return;
			}

			normal.toVector2(normal2d);
			var angle = GS.MathHelper.vec2AngleDirected(axis, normal2d) + Math.PI;

			var k = angle - Math.random() * Math.PI;
			normal2d.set(Math.sin(k), Math.cos(k));

			particle.acceleration.x = normal2d.x;
			particle.acceleration.z = normal2d.y;
			particle.acceleration.multiplyScalar(particle.horizontalSpeed * this.particleSpeed);
			particle.acceleration.y = particle.verticalSpeed * this.particleSpeed;

			// this.grid.addDebugLine(particle.position.clone(), 
			// 	particle.position.clone().add(particle.acceleration.clone().normalize().multiplyScalar(5)), 0x0080ff);

			particle.mesh.rotation.y += angle;

			this.calculateFloorImpactY(particle);			
		}
	}(),

	getGeometry: function(width, height, depth) {
		var id = width.toFixed(2) + height.toFixed(2) + depth.toFixed(2);
		if (!(id in this.geometries)) {
			this.geometries[id] = new THREE.BoxGeometry(width, height, depth);
		}
		return this.geometries[id];
	},

	getMaterial: function(color) {
		var id = color.toString();
		if (!(id in this.materials)) {
			this.materials[id] = new THREE.MeshBasicMaterial({ color: color });
		}
		return this.materials[id];
	},
};