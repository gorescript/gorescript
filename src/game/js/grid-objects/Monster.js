GS.Monster = function(grid, layer, sourceObj) {
	GS.GridObject.apply(this, arguments);

	this.monsterType = GS.MapEntities[sourceObj.type].name;
	$.extend(true, this, GS.Monsters[this.monsterType]);

	this.xAngle = 0;
	this.direction = new THREE.Vector3();

	this.view = {
		collisionData: {
			boundingBox: new THREE.Box3(),
			boundingSquare: new THREE.Box2(),
			ellipsoid: this.size,
			triangles: null,
		}
	};

	this.dead = false;
	this.health = this.maxHealth;
	this.scatterCooldown = 0;
	this.activateByScript = false;
	this.activated = false;
	this.moving = true;
	this.inPain = false;

	this.changeTargetMaxCooldown = GS.msToFrames(500);
	this.changeTargetCooldown = 1;
	this.meleeAttackCooldown = 0;
};

GS.Monster.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Monster,

	init: function() {
		this.animationView = new GS.AnimationView(this);
		this.animationView.init();
		this.animationView.setLoop("inactive");

		this.updateBoundingBox();
		this.updateMesh();

		this.sector = this.getSector();
	},

	update: function() {
		this.animationView.update();

		if (this.activated && !this.dead) {
			this.updateMove();
			this.updateAttack();
		}

		this.updateLightLevel();
	},

	updateLightLevel: function() {
		this.getLightColorFromSector(this.animationView.currentMesh.material.emissive, this.sector);
	},

	updateMesh: function() {
		this.view.mesh.position.copy(this.position);
		this.view.mesh.position.y += this.animationView.positionYOffset;
		this.view.mesh.rotation.y = this.xAngle + this.rotationOffset + this.animationView.rotationYOffset;
	},

	updateMove: function() {
		var newPos = new THREE.Vector3();
		var aux = new THREE.Vector3();
		var targetPos = new THREE.Vector3();

		return function() {
			var target = this.grid.player;

			if (this.scatterCooldown > 0) {
				this.scatterCooldown--;
			} else {
				if (target.dead) {
					this.scatter();
				} else
				if (this.changeTargetCooldown > 0) {
					this.changeTargetCooldown--;

					if (this.changeTargetCooldown === 0) {
						this.changeTargetCooldown = this.changeTargetMaxCooldown;
						targetPos.copy(target.position);

						var distanceToTarget = this.position.distanceTo(targetPos);
						if (distanceToTarget > 20) {
							aux.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(20);
							targetPos.add(aux);
						}

						this.direction.copy(targetPos).sub(this.position);
						this.direction.y = 0;
						this.direction.normalize();
						this.calculateRotation();
					}
				}
			}

			if (!this.inPain) {
				aux.copy(this.direction).multiplyScalar(this.speed);
				newPos.copy(this.position).add(aux);

				this.grid.collisionManager.collideMonster(this, this.position, newPos);
			} else {
				this.updateMesh();
			}
		}
	}(),

	updateAttack: function() {
		var target = this.grid.player;

		if (this.attackType === GS.MonsterAttackTypes.Melee) {
			if (this.meleeAttackCooldown > 0) {
				this.meleeAttackCooldown--;
			} else {
				if (!target.dead && !this.inPain) {
					var distanceToTarget = this.position.distanceTo(target.position);
					if (distanceToTarget < this.meleeRange && this.isFacing(target.position) &&
						this.grid.collisionManager.checkMonsterLineOfSight(this, target, this.meleeRange)) {

						this.grid.soundManager.playSound("monster_bite");
						this.meleeAttackCooldown = this.meleeAttackMaxCooldown;
						target.onHit(this.meleeDamage);
						this.grid.addMonsterImpactParticles(target.position);
					}
				}
			}
		}
	},

	isFacing: function() {
		var p = new THREE.Vector2();
		var t = new THREE.Vector2();
		var a = new THREE.Vector2();
		var b = new THREE.Vector2();

		return function(pos) {
			this.position.toVector2(p);
			pos.toVector2(t);
			var x = this.xAngle + this.rotationOffset;
			a.set(Math.sin(x - Math.PI / 2), Math.cos(x - Math.PI / 2)).add(p);
			b.set(Math.sin(x + Math.PI / 2), Math.cos(x + Math.PI / 2)).add(p);

			return GS.MathHelper.vec2PointSide(a, b, t);
		}
	}(),

	scatter: function() {
		var target = this.grid.player;

		if (this.scatterCooldown > 20) {
			return;
		}

		var distance = target.position.distanceTo(this.position);
		if (target.dead || distance > 10 * (1 + this.scale.x)) {
			this.direction = new THREE.Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1);
			this.direction.normalize();
			this.calculateRotation();

			this.scatterCooldown = 30;
		}
	},

	calculateRotation: function() {
		this.xAngle = Math.atan2(this.direction.x, this.direction.z) + Math.PI;
	},

	updateCollisionData: function() {
		var velocity = new THREE.Vector3();

		return function(newPos) {
			velocity.copy(newPos).sub(this.position);
			var currentSpeed = newPos.distanceTo(this.position);

			this.position.copy(newPos);
			this.updateTriangles(velocity);
			this.updateBoundingBox();
			this.updateMesh();

			if (currentSpeed / this.speed < 0.1) {
				this.scatter();
			}

			this.sector = this.getSector();
		}
	}(),

	activate: function(script) {
		if (script !== true && this.activateByScript) {
			return;
		}

		this.activated = true;
		this.animationView.setLoop("walk");
		this.grid.soundManager.playSound("monster_roar");
	},

	onHit: function(damage) {
		if (!this.activated) {
			this.activate();
		}

		if (Math.random() <= this.painChance) {
			this.inPain = true;
			this.animationView.pain();
			this.grid.soundManager.playSound("monster_pain");
		}

		this.health -= damage;
		if (this.health < 0) {
			this.health = 0;
			this.onDeath();
		}
	},

	onDeath: function() {
		this.dead = true;
		this.grid.soundManager.playSound("monster_death");
		this.animationView.setLoop("death");
		this.updateMesh();
	},
});
