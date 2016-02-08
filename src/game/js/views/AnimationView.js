GS.AnimationView = function(gridObject) {
	this.gridObject = gridObject;

	this.loops = {
		attack: {
			delay: 10,
		},
		inactive: {
			delay: 30,
		},
		walk: {
			delay: gridObject.walkDelay,
		},
		death: {
			delay: 30,
			runOnce: true,
		},
	};

	this.floatYDelta = 0.5;
	this.floatAngle = 0;
	this.floatSpeed = 0.175;
	this.inactiveFloatSpeed = 0.0875;
	this.painMaxAngle = Math.PI / 2;
	this.painAngle = 0;
	this.painSpeed = 0.05;
	this.painSgn = 1;

	this.rotationYOffset = 0;
	this.positionYOffset = 0;

	this.currentMesh = new THREE.Object3D();
};

GS.AnimationView.prototype = {
	init: function() {
		var that = this;

		$.extend(true, this, this.gridObject.view.mesh.userData);

		Object.keys(this.animations).forEach(function(key) {
			var loop = that.loops[key];
			if (that.loops[key] === undefined) {
				GAME.handleFatalError("animation loop not found");
				return;
			}

			loop.index = 0;
			loop.frames = that.animations[key];
			loop.max = loop.frames.length;
			loop.cooldown = Math.floor(Math.random() * (loop.delay - 1)) + 1;
		});

		this.initInactiveLoop();
	},

	update: function() {
		var loop = this.currentLoop;

		if (!(loop.runOnce && loop.index === loop.max - 1)) {
			if (loop.cooldown > 0) {
				loop.cooldown--;
				if (loop.cooldown === 0) {
					loop.cooldown = loop.delay;

					loop.index++;
					if (loop.index === loop.max) {
						loop.index = 0;
					}

					this.switchMesh();
				}
			}
		}

		if (!this.gridObject.dead) {
			if (this.gridObject.moving) {
				this.floatAngle += this.floatSpeed;
			} else
			if (loop === this.loops.inactive) {
				this.floatAngle += this.inactiveFloatSpeed;
			}

			this.positionYOffset = this.floatYDelta * Math.sin(this.floatAngle);

			if (Math.abs(this.painAngle) > 0) {
				this.painAngle -= this.painSgn * this.painSpeed;
				if (this.painSgn == 1 && this.painAngle < 0) {
					this.gridObject.inPain = false;
					this.painAngle = 0;
				} else
				if (this.painSgn == -1 && this.painAngle > 0) {
					this.gridObject.inPain = false;
					this.painAngle = 0;
				}
			}

			this.rotationYOffset = this.painAngle;
		}
	},

	initInactiveLoop: function() {
		var walk = this.loops.walk;

		var loop = this.loops.inactive;
		loop.index = 0;
		loop.frames = [];
		loop.cooldown = loop.delay;

		loop.frames.push(walk.frames[0]);
		loop.frames.push(walk.frames[2]);

		loop.max = loop.frames.length;
	},

	pain: function() {
		if (Math.floor(Math.random() * 2) === 0) {
			this.painAngle = this.painMaxAngle;
			this.painSgn = 1;
		} else {
			this.painAngle = -this.painMaxAngle;
			this.painSgn = -1;
		}
	},

	death: function() {
		this.setLoop("death");
		this.rotationYOffset = 0;
		this.positionYOffset = 0;
	},

	setLoop: function(name) {
		this.currentLoop = this.loops[name];
		this.switchMesh();
	},

	switchMesh: function() {
		var loop = this.currentLoop;

		this.currentMesh.visible = false;
		this.currentMesh = loop.frames[loop.index];
		this.currentMesh.visible = true;
	},
};