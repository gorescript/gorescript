GS.MusicManager = function() {
	this.volume = GS.Settings.music / 10;
};

GS.MusicManager.prototype = {
	init: function() {
		var ctx;

		if (typeof AudioContext !== "undefined") {
			ctx = new AudioContext();
		} else
		if (typeof webkitAudioContext !== "undefined") {
			ctx = new webkitAudioContext();
		} else {
			GAME.handleFatalError("No AudioContext support");
			return;
		}

		this.ctx = ctx;

		if (!this.ctx.createGain) {
			this.ctx.createGain = ctx.createGainNode;
		}

		this.gainNode = this.ctx.createGain();
		this.gainNode.gain.value = this._volume;
		this.gainNode.connect(this.ctx.destination);

		this.initTracks();
	},

	playTrack: function(name) {
		var that = this;
		this.currentTrack = this.tracks[name];

		if (this.source !== undefined) {
			this.source.stop(0);
		}

		this.source = this.ctx.createBufferSource();
		this.source.buffer = this.currentTrack.buffer;
		this.source.loop = true;
		this.source.connect(this.gainNode);
		if (!this.source.start) {
			this.source.start = source.noteOn;
		}
		this.source.start(0);
	},

	initTracks: function(soundBuffers) {
		this.tracks = {};
		for (var i in soundBuffers) {
			this.tracks[i] = {
				buffer: soundBuffers[i],
				duration: Math.ceil(soundBuffers[i].length / this.ctx.sampleRate * 1000),
			};
		}
	},

	set volume(value) {
		this._volume = value;
		if (this.gainNode !== undefined) {
			this.gainNode.gain.value = this._volume;
		}
	},

	get volume() {
		return this._volume;
	},
};