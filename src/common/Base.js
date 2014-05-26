"use strict";

var GS = GS || {};

GS.inherit = function(classObj, members) {
	var base = Object.create(classObj.prototype);

	Object.getOwnPropertyNames(members).forEach(function(prop) {
		var desc = Object.getOwnPropertyDescriptor(members, prop);

		if (desc.get !== undefined) {
			base.__defineGetter__(prop, desc.get);
		} else {
			base[prop] = members[prop];
		}

		if (desc.set !== undefined) {
			base.__defineSetter__(prop, desc.set);
		}
	});
	
	return base;
};
	
GS.pushArray = function(dst, src) {
	src.forEach(function(x) {
		this.push(x); 
	}, dst);
};

GS.msToFrames = function(ms) {
	return Math.round(ms / 16.66);
};

GS.pad = function(n, width, z) {
	z = z || "0";
	n = n + "";
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

GS.logOnce = function(id, str) {
	if (GS.logOnce[id.toString()] === true) {
		return;
	}

	GS.logOnce[id.toString()] = true;
	console.log(str);
},

GS.isFirefox = typeof InstallTrigger !== "undefined"; 

GS.Base = function() {
	this.clearColor = 0x000000;
	this.antialias = true;

	this.cameraFov = 90;
	this.cameraNear = 0.1;
	this.cameraFar = 1000;
	this.timeStep = 0.01666;

	this.fpsCounter = {
		updateRate: 0,
		frameRate: 0,
		updates: 0,
		frames: 0,
		currentTime: this.getCurrentTime(),
	};

	this.requestAnimationFrameId = null;
};

GS.Base.prototype = {
	constructor: GS.Base,

	init: function() {
		var that = this;

		$(document).on("contextmenu", function(){
			return false;
		});

		this.renderer = new THREE.WebGLRenderer({ antialias: this.antialias });
		this.renderer.setClearColor(this.clearColor, 1);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.domElement.id = "game-canvas";
	
		this.camera = new THREE.PerspectiveCamera(this.cameraFov, window.innerWidth / window.innerHeight, this.cameraNear, this.cameraFar);

		this.scene = new THREE.Scene();

		window.addEventListener("resize", function() { that.onResize(); }, false);		

		document.body.appendChild(this.renderer.domElement);

		this.load();
	},

	load: function() {
		if (this.requestAnimationFrameId != null) {
			cancelAnimationFrame(this.requestAnimationFrameId);
		}

		this.currentTime = this.getCurrentTime();
		this.accumulator = 0.0;

		this.gameLoop();
	},

	update: function() {
	},

	draw: function() {
		this.renderer.render(this.scene, this.camera);
	},

	// http://gafferongames.com/game-physics/fix-your-timestep/
	gameLoop: function() {
		var that = this;

		var newTime = this.getCurrentTime();
		var frameTime = (newTime - this.currentTime) / 1000;
		if (frameTime > 0.33) {
			frameTime = 0.33;
		}
		this.currentTime = newTime;
		this.accumulator += frameTime;

		while (this.accumulator >= this.timeStep) {
			this.update();
			this.fpsCounter.updates++;

		 	this.accumulator -= this.timeStep;
		}

		this.draw();
		this.fpsCounter.frames++;

		if (newTime - this.fpsCounter.currentTime >= 1000) {
			this.fpsCounter.updateRate = this.fpsCounter.updates;
			this.fpsCounter.frameRate = this.fpsCounter.frames;
			this.fpsCounter.updates = 0;
			this.fpsCounter.frames = 0;
			this.fpsCounter.currentTime = newTime;

			if (this.showFPS) {
				// GS.DebugUI.trackNumericValue("update rate", this.fpsCounter.updateRate);
				GS.DebugUI.trackNumericValue("fps", this.fpsCounter.frameRate);
			}
		}

		this.requestAnimationFrameId = requestAnimationFrame(function() { that.gameLoop(); });
	},

	onResize: function() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
	},

	getCurrentTime: function() {
		return (self.performance !== undefined && self.performance.now !== undefined) ? self.performance.now() : Date.now();
	},	
};
