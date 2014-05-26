GS.DemoRecorder = function(fpsControls) {
	this.controls = fpsControls;	
	this.recording = false;
	this.playing = false;
	this.demoLoaded = false;

	this.playIndex = 0;
	this.playStartTime = null;
	this.playTimeStep = 16.66;
	this.playRepeat = true;
	this.playSkippedFrames = 0;

	this.demo = {
		actionLog: [],
		startPos: null,
		startAngles: null,
		startTime: null,
		endTime: null,
		duration: null,
	};

	this.keys = {
		ToggleRecord: 120, // F9
		Play: 85, // U
		TogglePause: 73, // I
	};

	this.skipFrames = true;
	this.showFrameSkips = true;
	this.showCounter = true;
};

GS.DemoRecorder.prototype = {
	constructor: GS.DemoRecorder,

	init: function() {
		var that = this;
		this.controls.addEventListener("update", function(e) { that.onControlsUpdate(e); });
	},

	load: function(path) {
		var that = this;
		$.ajax({ 
			url: path, 
			dataType: "text",
			success: function(jsonStr) {
				try {
					that.demo = JSON.parse(jsonStr, function(k, v) {
						if (k.indexOf("time") != -1 || k.indexOf("Time") != -1) {
							return new Date(v);
						}
						if (v instanceof Object) {
							if (v.x !== undefined && v.y !== undefined && v.z !== undefined) {
								return new THREE.Vector3(v.x, v.y, v.z);
							}
						}
						return v;
					});
					// GS.DebugUI.addTempLine("demo loaded");
					that.demoLoaded = true;
				}
				catch (err) {
					console.log(err.message);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(errorThrown);
			}
		});
	},

	download: function() {
		var json = JSON.stringify(this.demo);

		var zip = new JSZip();
		zip.file("demo.js", json);
		var content = zip.generate();
		location.href = "data:application/zip;base64," + content;
	},

	play: function() {
		if (this.demoLoaded) {
			GS.DebugUI.addTempLine("demo play start");
			this.playing = true;
			this.controls.enabled = false;
			this.playIndex = 0;
			this.playStartTime = new Date();
			this.playSkippedFrames = 0;
			this.controls.moveTo(this.demo.startPos);
			this.controls.setViewAngles(this.demo.startAngles.x, this.demo.startAngles.y);
		} else {
			GS.DebugUI.addTempLine("demo not loaded");
		}
	},

	// togglePause: function() {
	// 	this.playing = !this.playing;
	// 	if (this.playing) {
	// 		this.controls.enabled = false;
	// 		console.log("demo play resume");
	// 	} else {
	// 		this.controls.enabled = true;
	// 		console.log("demo play pause");
	// 	}
	// },

	stop: function() {
		this.playing = false;
		this.controls.enabled = true;

		GS.DebugUI.addTempLine("demo play end");
		var duration = new Date() - this.playStartTime;
		var diff = this.demo.duration - duration;
		var diffPercent = Math.abs(diff) / this.demo.duration;
		GS.DebugUI.addTempLine("demo duration diff: " + diff + "ms (" + diffPercent.toFixed(2) + "%)", 10000);
		var skippedFrames = (100 * this.playSkippedFrames / (this.demo.duration / this.playTimeStep));
		GS.DebugUI.addTempLine("demo skipped frames: " + this.playSkippedFrames + " (" + skippedFrames.toFixed(2) + "%)", 10000);
		GS.DebugUI.removeStaticLine("demo counter");

		if (this.playRepeat) {
			this.play();
		}
	},

	startRecording: function() {
		GS.DebugUI.addTempLine("demo record start");
		this.demo.actionLog.length = 0;
		this.demo.startPos = this.controls.eye.clone();
		this.demo.startAngles = { x: this.controls.xAngle, y: this.controls.yAngle };
		this.demo.startTime = new Date();
		this.demo.endTime = 0;
		this.demo.duration = 0;
	},

	stopRecording: function() {
		GS.DebugUI.addTempLine("demo record end");				
		this.demo.endTime = new Date();
		this.demo.duration = this.demo.endTime - this.demo.startTime;
		this.download();
	},

	advancePlayIndex: function() {
		if (!this.skipFrames) {
			this.playIndex += 1;
		} else {
			var now = new Date();
			var diff = now - this.playStartTime;			
			if (diff > (this.playIndex + 5) * this.playTimeStep) {
				var n = Math.floor((diff - this.playIndex * this.playTimeStep) / this.playTimeStep);
				if (this.showFrameSkips) {
					GS.DebugUI.addTempLine("demo frame skip: " + n, 1000);
				}
				this.playIndex += n;
				this.playSkippedFrames += n;
			}
			else {
				this.playIndex += 1;
			}
		}

		if (this.playIndex >= this.demo.actionLog.length) {
			this.playIndex = this.demo.actionLog.length - 1;
			this.playFrame();
			this.stop();
		} else {
			this.playFrame();
		}
	},

	playFrame: function() {
		var action = this.demo.actionLog[this.playIndex];
		this.controls.moveTo(action.pos);
		this.controls.setViewAngles(action.xAngle, action.yAngle);

		if (this.showCounter) {
			GS.DebugUI.setStaticLine("demo counter", this.playIndex + " / " + this.demo.actionLog.length, false);
		}
	},

	update: function() {		
		if (this.playing) {
			this.advancePlayIndex();		
		}

		GS.InputHelper.checkPressedKeys();

		if (!this.playing) {
			if (!GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.ToggleRecord)) {
				this.recording = !this.recording;
				if (this.recording) {
					this.startRecording();					
				} else {
					this.stopRecording();
				}
			}
		}

		if (!this.recording) {
			if (!GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Play)) {
				this.play();
			}
			// if (!GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.TogglePause)) {
			// 	this.togglePause();
			// }
		}
	},

	onControlsUpdate: function(e) {
		if (this.recording) {
			e.pos = e.pos.clone();
			this.demo.actionLog.push(e);
		}
	},
};