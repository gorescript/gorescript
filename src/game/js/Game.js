// @if TARGET='DESKTOP'
var electronRemote = require("remote");
// @endif

GS.GameVersion = "v1.2.1";
GS.ReleaseDate = "march 2017";

GS.GameStates = {
	Dispose: 0,
	PreLoad: 1,
	Loading: 2,
	PostLoad: 3,
	Play: 4,
	Menu: 5,
};

GS.Game = function() {
	GS.Base.call(this);
};

GS.Game.prototype = GS.inherit(GS.Base, {
	constructor: GS.Game,

	preInit: function() {
		// @if TARGET='WEB' || TARGET='DESKTOP'
		GS.Settings.loadSettings();
		// @endif

		// @if TARGET='CHROME_APP'
		if (GS.Settings.fullscreen) {
			chrome.app.window.current().fullscreen();
		}
		// @endif

		// @if TARGET='DESKTOP'
		if (GS.Settings.fullscreen) {
			electronRemote.getCurrentWindow().setFullScreen(true);
		}
		// @endif

		this.state = GS.GameStates.PreLoad;
		this.nextState = null;
		this.updated = false;
		this.firstLoad = true;
		this.firstPlay = true;
		this.mapWon = false;
		this.restartedLevel = false;

		this.antialias = false;
		this.clearColor = 0x336699;
		this.cameraFov = GS.Settings.fov;
		this.cameraFar = 1500;

		// @if TARGET='WEB'
		if (this.isTestMap()) {
			this.noMenu = true;
		} else {
		// @endif
			this.noMenu = false;
		// @if TARGET='WEB'
		}
		// @endif

		this.firstTimeInMenu = true;

		this.showFPS = GS.Settings.showFPS;
		this.showPerformanceDebugMeters = false;
	},

	init: function() {
		GS.DebugUI.init();
		GS.DebugUI.visible = false;

		this.loadingUI = new GS.LoadingUI();
		this.loadingUI.init();

		this.uiManager = new GS.UIManager();
		this.uiManager.init();

		this.soundManager = new GS.SoundManager();
		this.soundManager.init();

		this.musicManager = new GS.MusicManager();
		this.musicManager.init();

		this.initAssetLoader();

		this.keys = {
			Enter: 13,
			Escape: 27,
			Tab: 9,
		};

		GS.Base.prototype.init.call(this);

		this.graphicsManager = new GS.GraphicsManager(this.renderer, this.camera);
		this.graphicsManager.init();
	},

	preLoad: function() {
		this.uiManager.reset();

		this.loadingUI.percentLoaded = 0;
		this.loadingUI.show();

		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.Fog(new THREE.Color().setRGB(0, 0, 0).getHex(), 500, 900);

		if (!this.assetLoader.loaded) {
			this.assetLoader.load();
			this.nextState = GS.GameStates.Loading;
		} else {
			this.nextState = GS.GameStates.PostLoad;
		}
	},

	initAssetLoader: function() {
		var that = this;

		this.assetLoader = new GS.ZipAssetLoader(this.soundManager.ctx);

		this.assetLoader.init();
		this.assetLoader.addEventListener("progress", function(e) {
			that.loadingUI.updateProgress(e);
		});
		this.assetLoader.addEventListener("load", function(e) {
			that.loadingUI.updateProgress(e);
			that.nextState = GS.GameStates.PostLoad;
		});
	},

	postLoad: function() {
		if (this.firstLoad) {
			this.loadingUI.spinnerOnly = true;
			this.uiManager.initComponents(this.assetLoader.assets);
			this.openMenu();
			this.firstLoad = false;

			if (this.noMenu) {
				this.newGame();
			}
		} else {
			this.initComponents(this.assetLoader.assets);
			this.uiManager.initComponents(this.assetLoader.assets, this.grid);
			this.uiManager.useIngameMenu();

			this.nextState = GS.GameStates.Play;
			this.graphicsManager.monochromeEnabled = false;

			if (this.grid.aiManager.script !== undefined && !this.restartedLevel) {
				this.musicManager.playTrack(this.grid.aiManager.script.musicTrack);
			}
			this.restartedLevel = false;

			if (this.firstPlay) {
				this.firstPlay = false;
			}
		}
	},

	play: function() {
		GS.InputHelper.checkPressedKeys();

		if (!GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Escape)) {
			this.openMenu();
		}

		if (!this.grid.aiManager.mapWon && !GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Tab)) {
			this.uiManager.automap.visible = !this.uiManager.automap.visible;
			this.uiManager.overrideRedraw = true;
			this.graphicsManager.monochromeEnabled = this.uiManager.automap.visible;
		}

		if (this.grid.player.dead && !GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Enter)) {
			this.restartLevel();
		}

		if (this.grid.aiManager.mapWon && !GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Enter)) {
			if (this.grid.aiManager.script.nextMap !== undefined) {
				this.playerPersistencePackage = this.grid.player.getPersistencePackage();
				this.loadLevel(this.grid.aiManager.script.nextMap);
			}
		}

		if (!this.mapWon && this.grid.aiManager.mapWon) {
			this.mapWon = true;
			this.onMapWon();
		}

		if (!this.grid.aiManager.mapWon) {
			this.grid.update();
			TWEEN.update();
		}
		GS.DebugUI.update();

		this.uiManager.update();
	},

	onMapWon: function() {
		this.graphicsManager.monochromeEnabled = false;
	},

	menu: function() {
		GS.InputHelper.checkPressedKeys();

		if (!GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Escape)) {
			if (this.grid !== undefined) {
				this.closeMenu();
			}
		}

		this.uiManager.update();
	},

	openMenu: function() {
		this.nextState = GS.GameStates.Menu;

		if (this.grid !== undefined) {
			this.grid.player.inMenu = true;
			this.grid.player.controls.disable();
			// @if TARGET='WEB'
			this.grid.player.controls.detachEvents();
			// @endif
		}

		this.graphicsManager.monochromeEnabled = true;
		this.uiManager.menuActive = true;

		GS.DebugUI.visible = false;
	},

	closeMenu: function() {
		this.nextState = GS.GameStates.Play;

		if (this.grid !== undefined) {
			this.grid.player.inMenu = false;
			// @if TARGET='WEB'
			this.grid.player.controls.attachEvents();
			// @endif
			this.grid.player.controls.enable();
			this.grid.aiManager.resume();

			if (this.mapWon || !this.uiManager.automap.visible) {
				this.graphicsManager.monochromeEnabled = false;
			}
		} else {
			this.graphicsManager.monochromeEnabled = false;
		}

		if (this.firstTimeInMenu) {
			this.uiManager.removeNewsBox();
			this.firstTimeInMenu = false;
		}

		this.uiManager.menuActive = false;
		GS.DebugUI.visible = GS.Settings.showHUD;
	},

	restartLevel: function() {
		this.nextState = GS.GameStates.Dispose;
		this.restartedLevel = true;
	},

	loadLevel: function(name) {
		if (this.uiManager.menuActive) {
			this.closeMenu();
		}

		this.mapName = name;
		this.nextState = GS.GameStates.Dispose;
	},

	newGame: function() {
		if (this.uiManager.menuActive) {
			this.closeMenu();
		}

		// @if TARGET='WEB'
		if (this.isTestMap()) {
			this.mapName = "testMap";
		} else {
		// @endif
			this.mapName = "airstrip1";
		// @if TARGET='WEB'
		}
		// @endif

		this.nextState = GS.GameStates.Dispose;
	},

	isTestMap: function() {
		return window.location.search.toLowerCase().indexOf("testmap") > -1;
	},

	initComponents: function(assets) {
		var that = this;
		var map = this.assetLoader.mapLoader.parse(assets[GS.AssetTypes.Map][this.mapName]);
		this.mapWon = false;

		var viewFactory = new GS.ViewFactory(this.renderer, map, assets);
		viewFactory.init();
		var gridFactory = new GS.GridFactory(viewFactory, this.soundManager, this.renderer, this.scene, this.camera);
		this.grid = gridFactory.getGrid(map);

		this.soundManager.initSounds(assets[GS.AssetTypes.Sound]);
		this.musicManager.initTracks(assets[GS.AssetTypes.MusicTrack]);

		if (this.playerPersistencePackage !== undefined) {
			this.grid.player.applyPersistencePackage(this.playerPersistencePackage);
			this.playerPersistencePackage = undefined;
		}

		this.grid.update();
		this.graphicsManager.setGrid(this.grid);

		// @if TARGET='WEB'
		this.grid.player.controls.addEventListener("pointerLockDisabled", function() { that.openMenu(); });
		// @endif

		// console.log("collision triangles", viewFactory.triangleCount);
	},

	update: function() {
		var time;
		if (this.showPerformanceDebugMeters) {
			time = window.performance.now();
		}

		if (this.state == GS.GameStates.Dispose) {
			if (!this.updated) {
				this.updated = true;
				this.dispose();
			}
		} else
		if (this.state == GS.GameStates.PreLoad) {
			if (!this.updated) {
				this.updated = true;
				this.preLoad();
			}
		} else
		if (this.state == GS.GameStates.Loading) {
			this.updated = true;
		} else
		if (this.state == GS.GameStates.PostLoad) {
			if (!this.updated) {
				this.updated = true;
				this.postLoad();
			}
		} else
		if (this.state == GS.GameStates.Play) {
			this.updated = true;
			this.play();
		} else
		if (this.state == GS.GameStates.Menu) {
			this.updated = true;
			this.menu();
		}

		if (this.nextState !== null) {
			if (this.updated) {
				if (this.nextState == GS.GameStates.Play || this.nextState == GS.GameStates.Menu) {
					this.loadingUI.hide();
					this.uiManager.show();
				}
				// @if TARGET='CHROME_APP' || TARGET='DESKTOP'
				if (this.nextState == GS.GameStates.Play) {
					this.grid.player.controls.enable();
				}
				// @endif

				this.state = this.nextState;
				this.nextState = null;
				this.updated = false;
			}
		}

		if (this.showPerformanceDebugMeters) {
			this.updateTime = (window.performance.now() - time).toFixed(2);
			GS.DebugUI.trackNumericValue("updateTime", this.updateTime);
		}
	},

	draw: function() {
		var time;
		if (this.showPerformanceDebugMeters) {
			time = window.performance.now();
		}

		if (this.state == GS.GameStates.PreLoad) {
			this.loadingUI.draw();
		} else
		if (this.state == GS.GameStates.Loading) {
			this.loadingUI.draw();
		} else
		if (this.state == GS.GameStates.PostLoad) {
			this.loadingUI.draw();
		} else
		if (this.state == GS.GameStates.Play || this.state == GS.GameStates.Menu) {
			if (this.grid !== undefined) {
				this.graphicsManager.draw();
			}

			this.uiManager.draw();
		}

		if (this.showPerformanceDebugMeters) {
			this.drawTime = (window.performance.now() - time).toFixed(2);
			GS.DebugUI.trackNumericValue("drawTime", this.drawTime);
		}
	},

	onResize: function() {
		GS.Base.prototype.onResize.call(this);

		this.uiManager.onResize();
		this.loadingUI.onResize();

		if (this.graphicsManager !== undefined) {
			this.graphicsManager.onResize();
		}

		if (this.grid !== undefined) {
			this.grid.onResize();
			this.grid.player.playerView.onResize();
		}
	},

	// @if TARGET='WEB' || TARGET='DESKTOP'
	customMap: function() {
		var that = this;

		var customMapInput = $("#customMapInput");
		var files = customMapInput[0].files;

		if (files === undefined || files.length === 0) {
			customMapInput.trigger("click");
			return;
		}

		var file = files[0];
		var fileReader = new FileReader();

		fileReader.onload = function(e) {
			that.assetLoader.assets[GS.AssetTypes.Map].customMap = e.target.result;

			that.loadLevel("customMap");
		};

		fileReader.onerror = function(e) {
			GAME.handleFatalError("file read error - " + e.target.error.code);
		};

		fileReader.readAsText(file);
		customMapInput.val("");
	},
	// @endif

	// @if TARGET='CHROME_APP'
	customMap: function() {
		var that = this;

		var options = {
			accepts: [
				{
					extensions: ["js", "json"]
				}
			]
		};

		chrome.fileSystem.chooseEntry(options, function(fileEntry) {
			if (chrome.runtime.lastError) {
				return;
			}

			fileEntry.file(function(file) {
				var reader = new FileReader();

				reader.onloadend = function(e) {
					that.assetLoader.assets[GS.AssetTypes.Map].customMap = e.target.result;

					that.loadLevel("customMap");
				};

				reader.readAsText(file);
			});
		});
	},
	// @endif

	handleFatalError: function(message) {
		var that = this;

		document.body.innerHTML = "<span class='fatal-error'> fatal error: '" + message + "'</span><br/>";
		document.body.style.padding = "20px";

		var a = document.createElement("a");
		// @if TARGET='WEB' || TARGET='DESKTOP'
		a.innerHTML = "click here or refresh page to restart";
		// @endif
		// @if TARGET='CHROME_APP'
		a.innerHTML = "click here to restart";
		// @endif
		a.className = "fatal-error-link";
		a.onclick = function() {
			// @if TARGET='WEB' || TARGET='DESKTOP'
			window.location.reload();
			// @endif
			// @if TARGET='CHROME_APP'
			chrome.runtime.reload();
			// @endif
		};

		document.body.appendChild(a);

		this.nextState = GS.GameStates.Dispose;
	},

	updateFov: function() {
		this.cameraFov = GS.Settings.fov;
		this.camera.fov = GS.Settings.fov;
		this.camera.updateProjectionMatrix();

		if (this.state == GS.GameStates.Play) {
			this.grid.updateFov();
		}
	},

	disposeEnd: function() {
		TWEEN.removeAll();
		this.grid = undefined;
		this.graphicsManager.reset();
		this.scene = undefined;
		this.uiManager.dispose();

		this.nextState = GS.GameStates.PreLoad;
	},

	// @if TARGET='WEB'
	dispose: function() {
		var that = this;

		if (this.grid !== undefined) {
			this.grid.player.controls.dispose(function() {
				that.disposeEnd();
			});
		} else {
			this.disposeEnd();
		}
	},
	// @endif

	// @if TARGET='CHROME_APP' || TARGET='DESKTOP'
	dispose: function() {
		var that = this;

		if (this.grid !== undefined) {
			this.grid.player.controls.dispose();
		}
		this.disposeEnd();
	},
	// @endif

	// @if TARGET='CHROME_APP'
	exit: function() {
		this.dispose();

		chrome.app.window.current().close();
	},
	// @endif

	// @if TARGET='DESKTOP'
	exit: function() {
		this.dispose();

		electronRemote.getCurrentWindow().close();
	},
	// @endif
});

var GAME;
window.addEventListener("load", function() {
	GS.Detector.run(function() {
		GAME = new GS.Game();

		// @if TARGET='WEB' || TARGET='DESKTOP'
		GAME.preInit();
		GAME.init();
		// @endif

		// @if TARGET='CHROME_APP'
		GS.Settings.loadSettings(function() {
			GAME.preInit();
			GAME.init();
		});
		// @endif
	});
}, false);