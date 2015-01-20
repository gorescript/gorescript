GS.FPSControls = function(camera) {
	this.camera = camera;

	this.eye = new THREE.Vector3();
	this.followingEye = new THREE.Vector3();
	this.look = new THREE.Vector3(0, 0, -10).add(this.eye);
	this.lookNoOffset = this.look.clone();

	this.moveSpeed = 1;
	this.lookSpeed = 0.066 * (GS.Settings.mouse / 5);
	this.mouseInvertY = GS.Settings.mouseInvertY;

	this.forwardLookVector = new THREE.Vector3(0, 0, -1);
	this.forwardMoveVector = new THREE.Vector3(0, 0, -1);
	this.rightLookVector = new THREE.Vector3(1, 0, 0);
	this.rightMoveVector = new THREE.Vector3(1, 0, 0);

	this.xAngle = 270;
	this.yAngle = 90;
	this.viewOffsetY = 0;
	this.eyeOffsetY = 3.5;

	this.pointerLockEnabled = false;

	this.onHandleCollisions = function(oldPos, newPos) {};

	this.enabled = true;
	this.fly = false;
	this.ySmoothing = false;
	this.ySmoothingFactor = 0.1;	
};

GS.FPSControls.prototype = {
	constructor: GS.FPSControls,

	init: function() {
		var that = this;
		var pointerLock = "pointerLockElement" in document;
		if (!pointerLock) {
			throw "Pointer Lock API not supported";
		}

		this.canvas = $("#game-canvas")[0];
		this.debugCanvas = $("#debug-ui-canvas")[0];

		this.setViewAngles(this.xAngle, this.yAngle);
	},

	enable: function() {
		var that = this;
		this.canvas.requestPointerLock();
		$(document).off("mousemove.fpsControls");
		$(document).on("mousemove.fpsControls", function(e) { that.onMouseMove(e.originalEvent); });
	},

	disable: function() {
		document.exitPointerLock();
		$(document).off("mousemove.fpsControls");
	},


	onMouseMove: function(e) {
		if (!this.enabled) {
			return;
		}

		var mx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
		var my = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

		var invertY = this.mouseInvertY ? -1 : 1;

		this.setViewAngles(this.xAngle + mx * this.lookSpeed, this.yAngle + invertY * my * this.lookSpeed);
	},

	setViewOffsetY: function(y) {
		this.viewOffsetY = y;
	},

	update: function() {
		if (!this.enabled) {
			return;
		}

		var x = 0;
		var z = 0;

		if (GS.Keybinds.moveForward.inUse) {
			z++;
		}
		if (GS.Keybinds.moveBackward.inUse) {
			z--;
		}
		if (GS.Keybinds.strafeLeft.inUse) {
			x--;
		}
		if (GS.Keybinds.strafeRight.inUse) {
			x++;
		}

		this.move(x, z);
		this.dispatchEvent({ type: "update", pos: this.eye, xAngle: this.xAngle, yAngle: this.yAngle, look: this.lookNoOffset });
	},

	moveTo: function(pos) {
		this.eye.copy(pos);
		this.updateCamera();
	},

	move: function() {
		var newPos = new THREE.Vector3();
		var aux = new THREE.Vector3();

		return function(x, z) {
			newPos.copy(this.eye);

			if (x !== 0 || z !== 0) {
				aux.copy(this.rightMoveVector).multiplyScalar(this.moveSpeed * x);
				newPos.add(aux);
				aux.copy(this.forwardMoveVector).multiplyScalar(this.moveSpeed * z);
				newPos.add(aux);
			}

			this.onHandleCollisions(this.eye, newPos);

			this.eye.copy(newPos);
			this.updateCamera();
		}
	}(),

	updateCamera: function() {
		this.followingEye.x = this.eye.x;
		this.followingEye.z = this.eye.z;
		if (this.ySmoothing) {
			if (this.followingEye.y != this.eye.y) {
				this.followingEye.y = this.followingEye.y + this.ySmoothingFactor * (this.eye.y - this.followingEye.y);
			}
		} else {
			this.followingEye.y = this.eye.y;
		}

		this.camera.position.copy(this.followingEye);
		this.camera.position.y += this.viewOffsetY + this.eyeOffsetY;
		this.lookNoOffset.addVectors(this.followingEye, this.forwardLookVector);
		this.look.addVectors(this.camera.position, this.forwardLookVector);
		this.camera.lookAt(this.look);
	},
	
	setViewAngles: function() {
		var right = new THREE.Vector3();
		var forward = new THREE.Vector3();

		return function(x, y) {
			this.xAngle = x;
			this.yAngle = GS.MathHelper.clamp(y, 10, 170);

			var x = Math.sin(Math.PI / 180 * this.yAngle) * Math.cos(Math.PI / 180 * this.xAngle);
			var y = Math.cos(Math.PI / 180 * this.yAngle);
			var z = Math.sin(Math.PI / 180 * this.yAngle) * Math.sin(Math.PI / 180 * this.xAngle);

			forward.set(x, y, z);

			x = Math.sin(Math.PI / 180 * this.yAngle) * Math.cos(Math.PI / 180 * (this.xAngle + 90));
			z = Math.sin(Math.PI / 180 * this.yAngle) * Math.sin(Math.PI / 180 * (this.xAngle + 90));

			right.set(x, 0, z);

			this.forwardLookVector.copy(forward);
			if (!this.fly) {
				this.forwardMoveVector.set(forward.x, 0, forward.z).normalize();
			}
			else {
				this.forwardMoveVector.copy(forward).normalize();
			}
			this.rightLookVector.copy(right).normalize();
			this.rightMoveVector.copy(right).normalize();

			this.updateCamera();
		}
	}(),

	dispose: function(callback) {
		this.onHandleCollisions = undefined;
		this.disable();
	},
};

THREE.EventDispatcher.prototype.apply(GS.FPSControls.prototype);