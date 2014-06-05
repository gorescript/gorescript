GS.RotationControls = function(camera) {
	this.camera = camera;

	this.isRotating = true;
	this.rotationSpeed = 1;
	this.dragSpeed = 250;

	this.look = new THREE.Vector3();
	this.zoomSpeed = 0.25;
	this.distance = 2.5;
	this.minDistance = 1.5;
	this.maxDistance = 3.5;

	this.xAngle = 60;
	this.yAngle = 60;

	this.mouseDownProperty = "rightMouseDown";
	this.canvasSelector = "canvas";
};

GS.RotationControls.prototype = {
	constructor: GS.RotationControls,

	init: function() {
		this.ox = GS.InputHelper.mouseX / window.innerWidth;
		this.oy = GS.InputHelper.mouseY / window.innerHeight;

		this.updateCamera();

		var that = this;
		$(document).mousemove(function(e) {
			if (GS.InputHelper[that.mouseDownProperty]) {
				var distanceFactor = 0.5 + (that.distance - that.minDistance) / (that.maxDistance - that.minDistance);

				var mx = GS.InputHelper.mouseX / window.innerWidth;
				var my = GS.InputHelper.mouseY / window.innerHeight;
				that.xAngle += (mx - that.ox) * that.dragSpeed * distanceFactor;
				that.yAngle += -(my - that.oy) * that.dragSpeed * distanceFactor;
				that.ox = mx;
				that.oy = my;

				if (that.xAngle >= 360) {
					that.xAngle -= 360;
				}

				that.yAngle = GS.MathHelper.clamp(that.yAngle, 1, 179);

				that.isRotating = false;
				that.updateCamera();
				$(that.canvasSelector).css("cursor", "move");
			} else {
				that.ox = GS.InputHelper.mouseX / window.innerWidth;
				that.oy = GS.InputHelper.mouseY / window.innerHeight;
				$(that.canvasSelector).css("cursor", "default");
			}
		});
	},

	update: function() {
		var hasDragged = false;
		var hasZoomed = false;

		if (this.isRotating) {
			this.xAngle += this.rotationSpeed;
			if (this.xAngle >= 360) {
				this.xAngle -= 360;
			}
		}

		while (GS.InputHelper.mouseWheelEvents.length > 0) {
			var delta = GS.InputHelper.mouseWheelEvents.shift();
			if (delta < 0) {
				this.distance += this.zoomSpeed;
				this.distance = GS.MathHelper.clamp(this.distance, this.minDistance, this.maxDistance);
				hasZoomed = true;
			}
			if (delta > 0) {
				this.distance -= this.zoomSpeed;
				this.distance = GS.MathHelper.clamp(this.distance, this.minDistance, this.maxDistance);
				hasZoomed = true;
			}
		}

		if (hasZoomed || this.isRotating) {
			this.updateCamera();
		}
	},

	updateCamera: function() {
		var x = this.look.x + this.distance * Math.sin(Math.PI / 180 * this.yAngle) * Math.cos(Math.PI / 180 * this.xAngle);
		var y = this.look.y + this.distance * Math.cos(Math.PI / 180 * this.yAngle);
		var z = this.look.z + this.distance * Math.sin(Math.PI / 180 * this.yAngle) * Math.sin(Math.PI / 180 * this.xAngle);
		
		this.camera.position.set(x, y, z);
		this.camera.lookAt(this.look);
	},
};