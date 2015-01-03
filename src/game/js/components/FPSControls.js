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
		var pointerLock = "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;
		if (!pointerLock) {
			throw "Pointer Lock API not supported";
		}

		this.attachEvents();

		this.setViewAngles(this.xAngle, this.yAngle);
	},

	attachEvents: function() {
		var that = this;

		$(document).on("pointerlockchange.fpsControls", function(e) { that.onPointerLockChange(e); });
		$(document).on("mozpointerlockchange.fpsControls", function(e) { that.onPointerLockChange(e); });
		$(document).on("webkitpointerlockchange.fpsControls", function(e) { that.onPointerLockChange(e); });

		$(document).on("pointerlockerror.fpsControls", function(e) { that.onPointerLockError(e); });
		$(document).on("mozpointerlockerror.fpsControls", function(e) { that.onPointerLockError(e); });
		$(document).on("webkitpointerlockerror.fpsControls", function(e) { that.onPointerLockError(e); });

		this.canvas = $("#game-canvas")[0];
		this.debugCanvas = $("#debug-ui-canvas")[0];

		var rightMouseDown = false;
		$(this.debugCanvas).on("mousedown.fpsControls", function(e) { 
			if (e.which == 3) { 
				rightMouseDown = true; 
			} 
		});
		$(this.debugCanvas).on("mouseup.fpsControls", function(e) { 
			if (e.which == 3 && rightMouseDown) { 
				rightMouseDown = false; 
				that.enable(); 
			}
		});
	},
	
	detachEvents: function() {
		$(this.debugCanvas).off("mousedown.fpsControls");
		$(this.debugCanvas).off("mouseup.fpsControls");

		$(document).off("pointerlockchange.fpsControls");
		$(document).off("mozpointerlockchange.fpsControls");
		$(document).off("webkitpointerlockchange.fpsControls");

		$(document).off("pointerlockerror.fpsControls");
		$(document).off("mozpointerlockerror.fpsControls");
		$(document).off("webkitpointerlockerror.fpsControls");
	},

	enable: function() {
		if (!this.pointerLockEnabled) {
			this.canvas.requestPointerLock = this.canvas.requestPointerLock || 
				this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
			this.canvas.requestPointerLock();
		}
	},

	disable: function() {
		if (this.pointerLockEnabled) {
			document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
			document.exitPointerLock();			
		}
	},

	onPointerLockChange: function(e) {
		var that = this;

		var isCanvas = document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas ||
			document.webkitPointerLockElement === this.canvas;

		if (isCanvas) {
			this.pointerLockEnabled = true;
			$(document).on("mousemove.fpsControls", function(e) { that.onMouseMove(e.originalEvent); });
			this.dispatchEvent({ type: "pointerLockEnabled" });
		} else {
			this.pointerLockEnabled = false;
			$(document).off("mousemove.fpsControls");

			if (this.disposeCallback !== undefined) {
				this.detachEvents();
				this.disposeCallback();
			} else {
				this.dispatchEvent({ type: "pointerLockDisabled" });
			}
		}
	},

	onPointerLockError: function() {
	},

	onMouseMove: function(e) {
		if (!this.enabled) {
			return
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
		if (this.pointerLockEnabled) {
			this.disposeCallback = callback;
		}

		this.onHandleCollisions = undefined;
		this.disable();

		if (!this.pointerLockEnabled) {
			this.detachEvents();
			callback();
		}
	},
};

THREE.EventDispatcher.prototype.apply(GS.FPSControls.prototype);