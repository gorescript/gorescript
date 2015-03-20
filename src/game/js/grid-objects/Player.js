GS.Player = function(grid, camera, playerView) {
	GS.GridObject.call(this, grid);

	this.camera = camera;
	this.playerView = playerView;
	this.playerView.player = this;

	this.moveSpeed = 1.5;
	this.godEnabled = false;
	this.flyEnabled = false;
	this.noClipEnabled = false;
	this.inMenu = false;

	this.health = 100;
	this.dead = false;
    this.hasQuad = false;

	this.size = new THREE.Vector3(3, 7, 3);
	this.useRange = this.size.x + 15;
	this.bloodColor = new THREE.Color().setRGB(1, 0, 0).getHex();
	this.direction = new THREE.Vector3();

	this.view = {
		collisionData: {
			boundingBox: new THREE.Box3(),
			boundingSquare: new THREE.Box2(),
			ellipsoid: this.size,
			triangles: null,
		},
	};

	this.moving = false;
	this.shooting = false;
	this.canUse = true;

	this.ySmoothingMaxCooldown = GS.msToFrames(500);
	this.ySmoothingCooldown = 0;	

	this.swapWeaponsOnPickup = true;
};

GS.Player.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Player,

	init: function() {
		var that = this;

		this.availableWeapons = $.extend(true, {}, GS.Weapons);
		Object.keys(this.availableWeapons).forEach(function(key) {
			that.availableWeapons[key].pickedUp = false;
			that.availableWeapons[key].cooldownRemaining = 0;
		});
		
		this.computeYFromSector();
		this.initTriangles();
		this.updateBoundingBox();

		this.controls = new GS.FPSControls(this.camera);
		this.controls.eye.copy(this.position);
		this.controls.followingEye.copy(this.position);
		this.controls.moveSpeed = this.moveSpeed;
		this.controls.init();

		this.controls.onHandleCollisions = function(oldPos, newPos) {
			if (!that.noClipEnabled) {
				that.grid.collisionManager.collidePlayer(that, oldPos, newPos);
			} else {
				that.updateCollisionData(newPos);
			}
		};

		that.availableWeapons.pistol.pickedUp = true;
		that.availableWeapons.pistol.cooldownRemaining = 0;

		this.weapon = this.availableWeapons.pistol;
		this.weaponName = "pistol";
		this.playerView.changeToWeaponInstant("pistol");
	},

	getPersistencePackage: function() {
		var pkg = {
			health: this.health,
			weapons: {},
			currentWeapon: this.weaponName,
		};

		for (var i in this.availableWeapons) {
			pkg.weapons[i] = {};
			pkg.weapons[i].pickedUp = this.availableWeapons[i].pickedUp;
			pkg.weapons[i].ammo = this.availableWeapons[i].ammo;			
		}

		return pkg;
	},

	applyPersistencePackage: function(pkg) {
		this.health = pkg.health;

		for (var i in this.availableWeapons) {
			this.availableWeapons[i].pickedUp = pkg.weapons[i].pickedUp;
			this.availableWeapons[i].ammo = pkg.weapons[i].ammo;
		}

		this.weapon = this.availableWeapons[pkg.currentWeapon];
		this.weaponName = pkg.currentWeapon;
		this.playerView.changeToWeaponInstant(pkg.currentWeapon);
	},

	giveAll: function() {
		var that = this;
		Object.keys(this.availableWeapons).forEach(function(key) {
			var weapon = that.availableWeapons[key];

			weapon.pickedUp = true;
			weapon.cooldownRemaining = 0;

			if (!weapon.infiniteAmmo) {
				weapon.ammo = weapon.ammoMax;
			}
		});
	},

	fly: function(value) {
		if (value === undefined) {
			this.flyEnabled = !this.flyEnabled;
		} else {
			this.flyEnabled = value;
		}

		this.controls.fly = this.flyEnabled;
		if (this.flyEnabled) {
			this.playerView.viewBob.enabled = false;
			this.playerView.weaponBob.enabled = false;
		} else {
			this.playerView.viewBob.enabled = true;
			this.playerView.weaponBob.enabled = true;
		}
	},

	noClip: function(value) {
		if (value === undefined) {
			this.noClipEnabled = !this.noClipEnabled;
		} else {
			this.noClipEnabled = value;
		}
	},

	god: function(value) {
		if (value === undefined) {
			this.godEnabled = !this.godEnabled;
		} else {
			this.godEnabled = value;
		}
	},

	initTriangles: function() {
		var triangles = GS.Cube.getVertices();
		for (var i = 0; i < triangles.length; i++) {
			triangles[i].multiply(this.size).add(this.position);
		}
		this.view.collisionData.triangles = triangles;
	},

	update: function() {
		if (!this.dead) {
			this.updateControls();
			this.updateUse();
			this.updateShoot();
			this.updateChangeWeapon();
		}
	},

	afterCollision: function(result) {
		if (result.climbing && !(result.gridObject instanceof GS.Elevator)) {
			this.ySmoothingCooldown = this.ySmoothingMaxCooldown;
		}
	},

	onHit: function(damage) {
		if (!this.godEnabled) {
			this.health -= damage;
			if (this.health <= 0) {
				this.health = 0;
				this.onDeath();
			}
			this.playerView.onDamage();
		}
	},

	onDeath: function() {
		this.dead = true;
		this.grid.soundManager.playSound("player_death");

		if (this.weapon !== undefined) {
			this.playerView.onDeath();
		}
	},

	onItemCollision: function(item) {
		var name = GS.MapEntities[item.sourceObj.type].name;

		if (this.pickupWeapon(name) || this.pickupAmmo(name) || this.pickupMedkit(name) || this.pickupQuad(name)){
			this.grid.aiManager.onPlayerItemPickup(this, item);
			item.remove();
			this.playerView.onItemPickup();
		}
	},

	pickupWeapon: function(name) {
		if (this.availableWeapons[name] !== undefined) {
			var weapon = this.availableWeapons[name];

			if (!weapon.pickedUp) {
				weapon.pickedUp = true;

				GS.DebugUI.addTempLine("picked up " + weapon.name);

				if (this.weapon === undefined ||
					this.swapWeaponsOnPickup && weapon.powerLevel > this.weapon.powerLevel) {
					this.weapon = weapon;
					this.weaponName = name;
					this.playerView.changeToWeapon(name);
				}
			}

			weapon.ammo += weapon.ammoClip;
			this.grid.soundManager.playSound("pickup_weapon");
			if (weapon.ammo > weapon.ammoMax) {
				weapon.ammo = weapon.ammoMax;
			}

			GS.DebugUI.addTempLine("picked up " + weapon.ammoClip + " " + weapon.name + " ammo");

			return true;
		}
		return false;
	},

	pickupAmmo: function(name) {
		var that = this;
		var once = false;

		if (name == "ammo") {
			Object.keys(this.availableWeapons).forEach(function(key) {
				var weapon = that.availableWeapons[key];

				if (!weapon.infiniteAmmo && weapon.ammo < weapon.ammoMax) {
					weapon.ammo += weapon.ammoClip;
					if (weapon.ammo > weapon.ammoMax) {
						weapon.ammo = weapon.ammoMax;
					}

					GS.DebugUI.addTempLine("picked up " + weapon.ammoClip + " " + weapon.name + " ammo");
					once = true;
				}
			});

			if (once) {
				this.grid.soundManager.playSound("pickup_ammo");
				return true;
			}
		}

		return false;
	},

	pickupMedkit: function(name) {
		var that = this;
		if (name == "medkit" && this.health < 100) {
			GS.DebugUI.addTempLine("picked up medkit");

			this.health += 25;
			if (this.health > 100) {
				this.health = 100;
			}

			this.grid.soundManager.playSound("pickup_item");
			return true;
		}
		return false;
	},
    
    pickupQuad: function(name) {
        var that = this;
        if (name == "quad") {
            GS.DebugUI.addTempLine("picked up quad damage");
            this.hasQuad = true;
            this.grid.soundManager.playSound("pickup_item");
            setTimeout(function() {
               GS.DebugUI.addTempLine("used up quad damage"); 
                that.hasQuad = false;
            }, 30000);
            return true;
        }
        return false;
    },

	updateUse: function() {
		if (this.canUse && GS.Keybinds.use.inUse) {			
			this.useTarget.onUse();
		}
	},

	updateShoot: function() {
		var that = this;
		if (this.weapon !== undefined) {
			if (this.weapon.cooldownRemaining > 0) {
				this.weapon.cooldownRemaining -= 1;
				return;
			}			

			var oldShooting = this.shooting;
			if (GS.Keybinds.shoot.inUse && this.playerView.weaponReady) {
				if (this.weapon.infiniteAmmo || this.weapon.ammo > 0) {
					this.shooting = true;
					if (this.shooting && !oldShooting) {
						this.shootStart();
					}

					if (!this.weapon.infiniteAmmo) {
						this.weapon.ammo -= this.weapon.bulletsPerShot;
					}

					this.playerView.shoot();
					this.playShootSound();
					this.weapon.cooldownRemaining = GS.msToFrames(this.weapon.cooldown);

					var projectileStart = this.getProjectileStart();
					if (this.weapon.hitscan) {
						this.grid.collisionManager.hitscan(this, projectileStart, this.weapon, this.xAngle, this.yAngle);
					} else 
					if (this.weaponName == "hyper_blaster") {
						this.grid.addProjectile(this, "hyper_blaster_bolt", projectileStart, this.direction.clone());
					} else
					if (this.weaponName == "pistol") {
						this.grid.addProjectile(this, "pistol_bolt", projectileStart, this.direction.clone());
					}					
				}

				if (!this.weapon.infiniteAmmo && this.weapon.ammo === 0) {
					this.trySwapToWeaponWithAmmo();
				}
			} else {
				this.shooting = false;
				if (!this.shooting && oldShooting) {
					this.shootEnd();
				}
			}
		}
	},

	playShootSound: function() {
		var name;
		if (this.weaponName == "double_shotgun") {
			name = "shotgun_fire";
		} else 
		if (this.weaponName == "hyper_blaster") {
			name = "hyper_blaster_fire";
		} else
		if (this.weaponName == "pistol") {
			name = "hyper_blaster_fire";
		}

		this.grid.soundManager.playSound(name);
	},

	shootStart: function() {
		this.grid.aiManager.onPlayerShoot(this);
	},

	shootEnd: function() {
	},

	trySwapToWeaponWithAmmo: function() {
		var keys = Object.keys(this.availableWeapons);
		for (var i = keys.length - 1; i >= 0; i--) {
			var name = keys[i];
			var weapon = this.availableWeapons[name];
			if (weapon.pickedUp && (weapon.infiniteAmmo || weapon.ammo > 0)) {
				this.changeToWeapon(name);
				break;
			}
		}
	},

	getProjectileStart: function() {
		var projectileStart = this.position.clone();
		projectileStart.y += this.controls.eyeOffsetY;
		return projectileStart;
	},

	updateChangeWeapon: function() {
		var that = this;
		Object.keys(this.availableWeapons).forEach(function(key) {
			var weapon = that.availableWeapons[key];
			if (weapon.pickedUp && weapon !== that.weapon && that.weapon !== undefined && that.playerView.weaponReady) {
				if (GS.Keybinds[weapon.name].inUse) {
					that.changeToWeapon(key);
				}
			}
		});
	},

	changeToWeapon: function(name) {
		this.weapon = this.availableWeapons[name];
		this.weaponName = name;
		this.playerView.changeToWeapon(name);
	},

	updateControls: function(e) {
		if (this.ySmoothingCooldown > 0) {
			this.ySmoothingCooldown--;
			this.controls.ySmoothing = true;
		} else {
			this.controls.ySmoothing = false;
		}

		this.controls.update();

		this.direction.copy(this.controls.lookNoOffset).sub(this.controls.followingEye).normalize();
		this.xAngle = this.controls.xAngle;
		this.yAngle = this.controls.yAngle;

		// GS.DebugUI.setStaticLine("direction", this.direction.toString(2));

		this.playerView.update();
	},

	moveStart: function() {
	},

	moveEnd: function() {
	},

	updateCollisionData: function(newPos) {
		this.playerView.updateThrottle(this.position, newPos);
		var velocity = newPos.clone().sub(this.position);
		this.updateTriangles(velocity);

		var oldMoving = this.moving;
		this.moving = !this.position.equals(newPos);
		this.position.copy(newPos);
		this.controls.eye.copy(newPos);

		// GS.DebugUI.setStaticLine("position", newPos.toString());

		if (this.moving && !oldMoving) {			
			this.moveStart();
		} else 
		if (!this.moving && oldMoving) {
			this.moveEnd();
		}

		this.updateBoundingBox();
	},
});
