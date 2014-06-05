GS.PlayerView = function() {
	this.weapons = {
		pistol: {
			position: new THREE.Vector3(2.75, -2.5, -4),
			startPosition: new THREE.Vector3(2.5, -6.5, 1),
			scale: new THREE.Vector3(0.4, 0.4, 0.4),
			rotation: new THREE.Vector3(0, THREE.Math.degToRad(-90), 0),
			pushback: 1,
			shootBackwardFactor: 0.5,
			shootForwardFactor: 0.5,
			muzzleDuration: GS.msToFrames(250),
			muzzleFlashColor: new THREE.Color().setRGB(1, 1, 1),
		},
		double_shotgun: {
			position: new THREE.Vector3(2.25, -3.5, -3),
			startPosition: new THREE.Vector3(2.5, -6.5, 1),
			scale: new THREE.Vector3(0.4, 0.4, 0.4),
			rotation: new THREE.Vector3(0, THREE.Math.degToRad(180), 0),
			pushback: 2,
			shootBackwardFactor: 0.1,
			shootForwardFactor: 0.9,
			muzzleDuration: GS.msToFrames(250),
			muzzleFlashColor: new THREE.Color().setRGB(1, 1, 1),
		},
		hyper_blaster: {
			position: new THREE.Vector3(2.75, -2.5, -3),
			startPosition: new THREE.Vector3(2.5, -6.5, 1),
			scale: new THREE.Vector3(0.4, 0.4, 0.4),
			rotation: new THREE.Vector3(0, THREE.Math.degToRad(-90), 0),
			pushback: 1,
			shootBackwardFactor: 0.5,
			shootForwardFactor: 0.5,
			muzzleDuration: GS.msToFrames(125),
			muzzleFlashColor: new THREE.Color().setRGB(1, 1, 1),
		},
	}
	$.extend(true, this.weapons, GS.Weapons);

	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

	this.screenOverlayColor = new THREE.Color(0x000000);
	this.screenOverlayColorFadeSpeed = 0.02;
	this.muzzleCooldown = 0;

	this.weaponReady = false;

	this.weaponBob = {
		enabled: GS.Settings.weaponBob,
		magnitudeX: 0.5,
		magnitudeY: 0.5,
		offset: new THREE.Vector3(),
		radian: 0,
		speed: 0.1,
	};

	this.viewBob = {
		enabled: GS.Settings.viewBob,
		magnitude: 1.5,
		offset: 0,
		radian: 0,
		speed: 0.2,
	};

	this.viewThrottle = new GS.SmoothNumber(0, 0.1);
	this.weaponThrottle = new GS.SmoothNumber(0, 0.1);

	this.tweens = {
		shoot: {
			easing: TWEEN.Easing.Sinusoidal.InOut,
		},
		show: {
			easing: TWEEN.Easing.Back.Out,
			duration: 500,
		},
		hide: {
			easing: TWEEN.Easing.Back.InOut,
			duration: 250,
		},
	};
};

GS.PlayerView.prototype = {
	init: function() {
		var that = this;
		Object.keys(this.weapons).forEach(function(key) {
			that.initWeaponMesh(key);
		});
	},

	addWeaponMesh: function(name, mesh) {
		this.weapons[name].mesh = mesh;
	},

	getWeaponMeshes: function() {
		var that = this;
		var meshes = [];
		Object.keys(this.weapons).forEach(function(key) {
			var weapon = that.weapons[key];
			meshes.push(weapon.mesh);
		});
		return meshes;
	},

	initWeaponMesh: function(name) {
		var weapon = this.weapons[name];

		if (weapon.mesh !== undefined) {
			weapon.mesh.visible = false;
			weapon.mesh.position.copy(weapon.position);
			weapon.mesh.rotation.x = weapon.rotation.x;
			weapon.mesh.rotation.y = weapon.rotation.y;
			weapon.mesh.rotation.z = weapon.rotation.z;
			weapon.mesh.scale.copy(weapon.scale);

			this.scene.add(weapon.mesh);
		}
	},

	update: function() {
		this.lightingView.updatePlayerLights();
		this.updateMuzzleFlash();
		this.updateLightLevel();
		this.updateViewBob();
		this.updateWeaponBob();
		this.updateScreenOverlay();
	},

	updateMuzzleFlash: function() {
		if (this.muzzleCooldown > 0) {
			this.muzzleCooldown--;
			if (this.muzzleCooldown == 0) {
				this.lightingView.endMuzzleFlash();				
			}
		}
	},

	updateLightLevel: function() {
		if (this.weapon !== undefined) {
			this.player.getLightColorFromSector(this.weapon.mesh.material.emissive);
		}
	},

	updateThrottle: function(oldPos, newPos) {
		var velocity = oldPos.toVector2().distanceTo(newPos.toVector2());
		this.viewThrottle.setTargetValue(velocity / this.player.moveSpeed);
		this.viewThrottle.update();
		if (!this.player.shooting && this.weaponReady) {			
			this.weaponThrottle.setTargetValue(velocity / this.player.moveSpeed);
			this.weaponThrottle.update();
		}
	},

	resetWeaponThrottle: function() {
		this.weaponThrottle.value = 0;
		this.weaponBob.radian = 0;
	},

	updateViewBob: function() {
		if (this.viewBob.enabled) {
			this.player.controls.setViewOffsetY(this.viewBob.offset);
			this.viewBob.radian += this.viewBob.speed;
			this.viewBob.offset = this.viewThrottle.value * this.viewBob.magnitude * Math.sin(this.viewBob.radian);			
		}
	},

	updateWeaponBob: function() {
		if (this.weaponBob.enabled && !this.player.shooting) {			
			this.weaponBob.radian += this.weaponBob.speed;

			var x = this.weaponThrottle.value * this.weaponBob.magnitudeX * Math.sin(this.weaponBob.radian);
			var y = -Math.abs(this.weaponThrottle.value * this.weaponBob.magnitudeY * Math.sin(this.weaponBob.radian));

			this.weaponBob.offset.set(x, y, 0);

			if (this.weapon !== undefined) {
				this.weapon.mesh.position.copy(this.weapon.position.clone().add(this.weaponBob.offset));
			}
		}
	},

	shoot: function() {
		var that = this;

		this.resetWeaponThrottle();	

		this.weapon.mesh.position.copy(this.weapon.position);

		var backward = this.weapon.position.clone();
		backward.z += this.weapon.pushback;
		var tweenShootBackward = new TWEEN.Tween(this.weapon.mesh.position).to(backward, 
			this.weapon.cooldown * this.weapon.shootBackwardFactor);
		tweenShootBackward.easing(this.tweens.shoot.easing);

		var tweenShootForward = new TWEEN.Tween(this.weapon.mesh.position).to(this.weapon.position, 
			this.weapon.cooldown * this.weapon.shootForwardFactor);
		tweenShootForward.easing(this.tweens.shoot.easing);

		tweenShootBackward.chain(tweenShootForward);
		tweenShootBackward.start();

		this.showMuzzleFlash();
	},

	showMuzzleFlash: function() {
		this.lightingView.beginMuzzleFlash(this.weapon.muzzleFlashColor);
		this.muzzleCooldown = this.weapon.muzzleDuration;
	},

	changeToWeapon: function(name) {
		var that = this;

		this.resetWeaponThrottle();

		this.weaponReady = false;
		if (this.weapon !== undefined) {
			this.hideWeapon(function() {
				that.showWeapon(name);
			})
		} else {
			this.showWeapon(name);
		}
	},

	showWeapon: function(name, callback) {
		var that = this;

		this.weapon = this.weapons[name];
		this.weapon.mesh.visible = true;		
		this.weapon.mesh.position.copy(this.weapon.startPosition);

		var tween = new TWEEN.Tween(this.weapon.mesh.position).to(this.weapon.position, this.tweens.show.duration);
		tween.easing(this.tweens.show.easing);
		tween.onComplete(function() {
			that.weaponReady = true;
			if (callback !== undefined) {
				callback();
			}
		});
		tween.start();
	},

	hideWeapon: function(callback) {
		var that = this;
		this.weaponReady = false;

		var tween = new TWEEN.Tween(this.weapon.mesh.position).to(this.weapon.startPosition, this.tweens.hide.duration);
		tween.easing(this.tweens.hide.easing);
		tween.onComplete(function() {
			that.weapon.mesh.visible = false;
			if (callback !== undefined) {
				callback();
			}
		})
		tween.start();
	},	

	onResize: function() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	},

	onItemPickup: function() {
		this.screenOverlayColor.setRGB(0.3, 0.3, 0);
		this.dispatchEvent({ type: "screenOverlayColorChange", color: this.screenOverlayColor });
	},

	onDamage: function() {
		this.screenOverlayColor.setRGB(0.6, 0, 0);
		this.dispatchEvent({ type: "screenOverlayColorChange", color: this.screenOverlayColor });
	},

	onDeath: function() {
		this.player.controls.eye.y -= this.player.size.y;
		this.player.controls.updateCamera();

		if (this.weapon !== undefined) {
			this.hideWeapon();
		}
	},

	updateScreenOverlay: function() {
		if (this.screenOverlayColor.r > 0 ||
			this.screenOverlayColor.g > 0 ||
			this.screenOverlayColor.b > 0) {

			this.screenOverlayColor.addScalar(-this.screenOverlayColorFadeSpeed);

			if (this.screenOverlayColor.r < 0) {
				this.screenOverlayColor.r = 0;
			}
			if (this.screenOverlayColor.g < 0) {
				this.screenOverlayColor.g = 0;
			}
			if (this.screenOverlayColor.b < 0) {
				this.screenOverlayColor.b = 0;
			}

			this.dispatchEvent({ type: "screenOverlayColorChange", color: this.screenOverlayColor });
		}
	},

	dispose: function() {
		this.tweens = undefined;
		this.lightingView = undefined;
		this.player = undefined;
		this.scene = undefined;

		this._listeners = undefined;
	},
};

THREE.EventDispatcher.prototype.apply(GS.PlayerView.prototype);
