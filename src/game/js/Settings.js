GS.Settings = function() {
	var settings = {
		fov: 75,
		ssao: true,
		bloom: true,
		noise: true,
		vignette: true,
		fxaa: true,
		viewBob: true,
		weaponBob: true,
		showFPS: true,
	};

	return {
		set fov(value) {
			var n = parseInt(value);
			if (!isNaN(n)) {
				n = Math.floor(GS.MathHelper.clamp(n, 60, 120));
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

		set showFPS(value) {
			settings.showFPS = (value === true);
			GAME.showFPS = settings.showFPS;
		},

		get showFPS() {
			return settings.showFPS;
		},
	}
}();