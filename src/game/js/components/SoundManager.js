GS.SoundManager = function() {
	this.volume = GS.Settings.sound / 10;
};

GS.SoundManager.prototype = {
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

		this.compressor = this.ctx.createDynamicsCompressor();
		this.gainNode.connect(this.compressor);
		this.compressor.connect(this.ctx.destination);

		this.initSounds();
	},

	playSound: function(name) {
		var that = this;
		var sound = this.sounds[name];

		if (sound.isPlaying && !sound.allowMultipleAtOnce) {
			return;
		}

		var source = this.ctx.createBufferSource();
		source.buffer = this.sounds[name].buffer;
		source.connect(this.gainNode);
		if (!source.start) {
			source.start = source.noteOn;
		}
		source.start(0);

		setTimeout(function() { sound.isPlaying = false }, sound.duration);

		sound.isPlaying = true;
	},

	initSounds: function(soundBuffers) {
		this.sounds = {};
		for (var i in soundBuffers) {
			this.sounds[i] = {
				buffer: soundBuffers[i],
				duration: Math.ceil(soundBuffers[i].length / this.ctx.sampleRate * 1000),
				isPlaying: false,
				allowMultipleAtOnce: GS.Assets[GS.AssetTypes.Sound][i].allowMultipleAtOnce,
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