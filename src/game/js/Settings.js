GS.Settings = function() {
	var _fov = 75;
	var _ssao = true;
	var _bloom = true;
	var _noise = true;
	var _vignette = true;
	var _fxaa = true;
	var _viewBob = true;
	var _weaponBob = true;

	return {
		set fov(value) {
			var n = parseInt(value);
			if (!isNaN(n)) {
				n = Math.floor(GS.MathHelper.clamp(n, 60, 120));
				_fov = n;

				GAME.updateFov();
			}
		},

		get fov() {
			return _fov;
		},

		set ssao(value) {
			_ssao = (value === true);
			GAME.graphicsManager.ssaoEnabled = _ssao;
		},

		get ssao() {
			return _ssao;
		},

		set bloom(value) {
			_bloom = (value === true);
			GAME.graphicsManager.bloomEnabled = _bloom;
		},

		get bloom() {
			return _bloom;
		},

		set noise(value) {
			_noise = (value === true);
			GAME.graphicsManager.noiseEnabled = _noise;
		},

		get noise() {
			return _noise;
		},

		set vignette(value) {
			_vignette = (value === true);
			GAME.graphicsManager.vignetteEnabled = _vignette;
		},

		get vignette() {
			return _vignette;
		},

		set fxaa(value) {
			_fxaa = (value === true);
			GAME.graphicsManager.fxaaEnabled = _fxaa;
		},

		get fxaa() {
			return _fxaa;
		},

		set viewBob(value) {
			_viewBob = (value === true);
			if (GAME.grid !== undefined) {
				GAME.grid.player.playerView.viewBob.enabled = _viewBob;
			}
		},

		get viewBob() {
			return _viewBob;
		},

		set weaponBob(value) {
			_weaponBob = (value === true);
			if (GAME.grid !== undefined) {
				GAME.grid.player.playerView.weaponBob.enabled = _weaponBob;
			}
		},

		get weaponBob() {
			return _weaponBob;
		},
	}
}();