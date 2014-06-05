GS.Settings = function() {
	var settings = {
		fovMin: 60,
		fovMax: 120,
		fov: 75,

		ssao: true,
		bloom: true,
		noise: true,
		vignette: true,
		fxaa: true,

		halfSize: false,
		showFPS: true,

		viewBob: true,
		weaponBob: true,

		soundMin: 0,
		soundMax: 10,
		sound: 5,

		musicMin: 0,
		musicMax: 10,
		music: 5,

		mouseMin: 1,
		mouseMax: 10,
		mouse: 5,
	};

	return {
		get fovMin() {
			return settings.fovMin;
		},

		get fovMax() {
			return settings.fovMax;
		},

		set fov(value) {
			var n = parseInt(value);
			if (!isNaN(n)) {
				n = Math.floor(GS.MathHelper.clamp(n, settings.fovMin, settings.fovMax));
				settings.fov = n;

				GAME.updateFov();
			}
		},

		get fov() {
			return settings.fov;
		},

		set ssao(value) {
			settings.ssao = (value === true);
			GAME.graphicsManager.ssaoEnabled = settings.ssao;
		},

		get ssao() {
			return settings.ssao;
		},

		set bloom(value) {
			settings.bloom = (value === true);
			GAME.graphicsManager.bloomEnabled = settings.bloom;
		},

		get bloom() {
			return settings.bloom;
		},

		set noise(value) {
			settings.noise = (value === true);
			GAME.graphicsManager.noiseEnabled = settings.noise;
		},

		get noise() {
			return settings.noise;
		},

		set vignette(value) {
			settings.vignette = (value === true);
			GAME.graphicsManager.vignetteEnabled = settings.vignette;
		},

		get vignette() {
			return settings.vignette;
		},

		set fxaa(value) {
			settings.fxaa = (value === true);
			GAME.graphicsManager.fxaaEnabled = settings.fxaa;
		},

		get fxaa() {
			return settings.fxaa;
		},

		set viewBob(value) {
			settings.viewBob = (value === true);
			if (GAME.grid !== undefined) {
				GAME.grid.player.playerView.viewBob.enabled = settings.viewBob;
			}
		},

		get viewBob() {
			return settings.viewBob;
		},

		set weaponBob(value) {
			settings.weaponBob = (value === true);
			if (GAME.grid !== undefined) {
				GAME.grid.player.playerView.weaponBob.enabled = settings.weaponBob;
			}
		},

		get weaponBob() {
			return settings.weaponBob;
		},

		set halfSize(value) {
			settings.halfSize = (value === true);
			GAME.graphicsManager.halfSizeEnabled = settings.halfSize;
		},

		get halfSize() {
			return settings.halfSize;
		},

		set showFPS(value) {
			settings.showFPS = (value === true);
			GAME.showFPS = settings.showFPS;
		},

		get showFPS() {
			return settings.showFPS;
		},

		get soundMin() {
			return settings.soundMin;
		},

		get soundMax() {
			return settings.soundMax;
		},

		set sound(value) {
			var n = parseInt(value);
			if (!isNaN(n)) {
				n = Math.floor(GS.MathHelper.clamp(n, settings.soundMin, settings.soundMax));
				settings.sound = n;

				GAME.soundManager.volume = settings.sound / 10;
			}
		},

		get sound() {
			return settings.sound;
		},

		get musicMin() {
			return settings.musicMin;
		},

		get musicMax() {
			return settings.musicMax;
		},

		set music(value) {
			var n = parseInt(value);
			if (!isNaN(n)) {
				n = Math.floor(GS.MathHelper.clamp(n, settings.musicMin, settings.musicMax));
				settings.music = n;

				GAME.musicManager.volume = settings.music / 10;
			}
		},

		get music() {
			return settings.music;
		},

		get mouseMin() {
			return settings.mouseMin;
		},

		get mouseMax() {
			return settings.mouseMax;
		},

		set mouse(value) {
			var n = parseInt(value);
			if (!isNaN(n)) {
				n = Math.floor(GS.MathHelper.clamp(n, settings.mouseMin, settings.mouseMax));
				settings.mouse = n;

				if (GAME.grid !== undefined) {
					GAME.grid.player.controls.lookSpeed = 0.066 * (settings.mouse / 5);
				}
			}
		},

		get mouse() {
			return settings.mouse;
		},
	}
}();