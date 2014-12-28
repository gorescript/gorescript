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

		halfSize: true,
		showFPS: true,

		viewBob: true,
		weaponBob: true,

		showHUD: true,
		showWeapon: true,

		soundMin: 0,
		soundMax: 10,
		sound: 5,

		musicMin: 0,
		musicMax: 10,
		music: 5,

		mouseMin: 1,
		mouseMax: 10,
		mouse: 5,
		mouseInvertY: false,

		keybinds: null,
	};

	return {
		loadSettings: function() {
			var jsonStr = localStorage["gs-settings"];
			if (jsonStr !== undefined) {
				var loadedSettings = JSON.parse(jsonStr);
				for (var i in loadedSettings) {
					if (i in settings) {
						settings[i] = loadedSettings[i];
					}
				}

				if (loadedSettings.keybinds) {
					GS.KeybindSettings.keybinds = loadedSettings.keybinds;
				}
			}

			GS.KeybindSettings.init();
			settings.keybinds = GS.KeybindSettings.keybinds;
		},

		saveSettings: function() {
			var jsonStr = JSON.stringify(settings);
			localStorage["gs-settings"] = jsonStr;
		},

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
				this.saveSettings();
			}
		},

		get fov() {
			return settings.fov;
		},

		set ssao(value) {
			settings.ssao = (value === true);
			GAME.graphicsManager.ssaoEnabled = settings.ssao;
			this.saveSettings();
		},

		get ssao() {
			return settings.ssao;
		},

		set bloom(value) {
			settings.bloom = (value === true);
			GAME.graphicsManager.bloomEnabled = settings.bloom;
			this.saveSettings();
		},

		get bloom() {
			return settings.bloom;
		},

		set noise(value) {
			settings.noise = (value === true);
			GAME.graphicsManager.noiseEnabled = settings.noise;
			this.saveSettings();
		},

		get noise() {
			return settings.noise;
		},

		set vignette(value) {
			settings.vignette = (value === true);
			GAME.graphicsManager.vignetteEnabled = settings.vignette;
			this.saveSettings();
		},

		get vignette() {
			return settings.vignette;
		},

		set fxaa(value) {
			settings.fxaa = (value === true);
			GAME.graphicsManager.fxaaEnabled = settings.fxaa;
			this.saveSettings();
		},

		get fxaa() {
			return settings.fxaa;
		},

		set viewBob(value) {
			settings.viewBob = (value === true);
			this.saveSettings();
			if (GAME.grid !== undefined) {
				GAME.grid.player.playerView.viewBob.enabled = settings.viewBob;				
			}
		},

		get viewBob() {
			return settings.viewBob;
		},

		set weaponBob(value) {
			settings.weaponBob = (value === true);
			this.saveSettings();
			if (GAME.grid !== undefined) {
				GAME.grid.player.playerView.weaponBob.enabled = settings.weaponBob;
			}
		},

		get weaponBob() {
			return settings.weaponBob;
		},

		set halfSize(value) {
			settings.halfSize = (value === true);
			this.saveSettings();
			GAME.graphicsManager.halfSizeEnabled = settings.halfSize;
		},

		get halfSize() {
			return settings.halfSize;
		},

		set showFPS(value) {
			settings.showFPS = (value === true);
			this.saveSettings();
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
				this.saveSettings();
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
				this.saveSettings();
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
				this.saveSettings();
			}
		},

		get mouse() {
			return settings.mouse;
		},

		set showHUD(value) {
			settings.showHUD = (value === true);
			this.saveSettings();
			GAME.uiManager.showHUD = settings.showHUD;
			GAME.uiManager.overrideRedraw = true;
		},

		get showHUD() {
			return settings.showHUD;
		},

		set showWeapon(value) {
			settings.showWeapon = (value === true);
			this.saveSettings();
			GAME.graphicsManager.showWeapon = settings.showWeapon;
		},

		get showWeapon() {
			return settings.showWeapon;
		},

		set mouseInvertY(value) {
			settings.mouseInvertY = (value === true);
			this.saveSettings();
			if (GAME.grid !== undefined) {
				GAME.grid.player.controls.mouseInvertY = settings.mouseInvertY;
			}
		},

		get mouseInvertY() {
			return settings.mouseInvertY;
		},
	}
}();