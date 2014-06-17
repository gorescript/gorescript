GS.GameVersion = "build 5 - june 17, 2014";

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

	GS.Settings.loadSettings();

	this.state = GS.GameStates.PreLoad;
	this.nextState = null;
	this.updated = false;
	this.firstLoad = true;
	this.firstPlay = true;
	
	this.antialias = false;
	this.clearColor = 0x336699;
	this.cameraFov = GS.Settings.fov;

	this.mapName = "airstrip1";
	this.useAssetsZip = false;

	if (GS.BuildOverride === true) {
		this.useAssetsZip = true;
	}
	
	this.showFPS = GS.Settings.showFPS;
};

GS.Game.prototype = GS.inherit(GS.Base, {
	constructor: GS.Game,

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

		if (this.useAssetsZip) {
			this.assetLoader = new GS.ZipAssetLoader(this.soundManager.ctx);
		} else {
			this.assetLoader = new GS.AssetLoader(this.soundManager.ctx);
		}

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
		} else {			
			this.initComponents(this.assetLoader.assets);			
			this.uiManager.initComponents(this.assetLoader.assets, this.grid);
			this.uiManager.useIngameMenu();

			// GAME.grid.exportMapToOBJ();

			this.nextState = GS.GameStates.Play;
			this.musicManager.playTrack("simple_action_beat");

			if (this.firstPlay) {
				GS.DebugUI.addTempLine("if you encounter frame rate issues, check out the options menu");
				this.firstPlay = false;
			}
		}
	},

	play: function() {
		GS.InputHelper.checkPressedKeys();

		if (!GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Escape)) {
			this.openMenu();
		}

		if (this.grid.player.dead && !GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Enter)) {
			this.restartLevel();
		}

		if (this.grid.aiManager.mapWon && !GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Enter)) {
			this.restartLevel();
		}

		if (!this.grid.aiManager.mapWon) {
			this.grid.update();
			TWEEN.update();
		}		
		GS.DebugUI.update();

		this.uiManager.update();
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
			this.grid.player.controls.detachEvents();
		}

		this.graphicsManager.monochromeEnabled = true;
		this.uiManager.menuActive = true;

		GS.DebugUI.visible = false;
	},

	closeMenu: function() {
		this.nextState = GS.GameStates.Play;

		if (this.grid !== undefined) {
			this.grid.player.inMenu = false;
			this.grid.player.controls.attachEvents();
			this.grid.player.controls.enable();
			this.grid.aiManager.resume();
		}

		this.graphicsManager.monochromeEnabled = false;
		this.uiManager.menuActive = false;

		GS.DebugUI.visible = true;
	},

	restartLevel: function() {
		this.nextState = GS.GameStates.Dispose;
	},

	loadLevel: function(name) { 
		if (this.uiManager.menuActive) {
			this.closeMenu();
		}

		this.mapName = mapName; 
		this.nextState = GS.GameStates.Dispose; 
	},

	newGame: function() {
		if (this.uiManager.menuActive) {
			this.closeMenu();
		}

		this.mapName = "airstrip1"; 
		this.nextState = GS.GameStates.Dispose; 
	},

	initComponents: function(assets) {
		var that = this;
		var map = this.assetLoader.mapLoader.parse(assets[GS.AssetTypes.Map][this.mapName]);

		var viewFactory = new GS.ViewFactory(this.renderer, map, assets);
		viewFactory.init();		
		var gridFactory = new GS.GridFactory(viewFactory, this.soundManager, this.renderer, this.scene, this.camera);
		this.grid = gridFactory.getGrid(map);

		this.soundManager.initSounds(assets[GS.AssetTypes.Sound]);
		this.musicManager.initTracks(assets[GS.AssetTypes.MusicTrack]);
		this.graphicsManager.setGrid(this.grid);
		
		this.grid.player.controls.addEventListener("pointerLockDisabled", function() { that.openMenu(); });

		// console.log("collision triangles", viewFactory.triangleCount);
	},

	update: function() {
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

		if (this.nextState != null) {
			if (this.updated) {
				if (this.nextState == GS.GameStates.Play || this.nextState == GS.GameStates.Menu) {
					this.loadingUI.hide();
					this.uiManager.show();
				}

				this.state = this.nextState;
				this.nextState = null;
				this.updated = false;
			}
		}
	},

	draw: function() {
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
});

var GAME;
window.addEventListener("load", function() {
	GS.Detector.run(function() {
		GAME = new GS.Game();
		GAME.init();
	});
}, false);