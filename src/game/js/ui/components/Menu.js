GS.UIComponents.Menu = function(vectorCanvas, assets) {	
	this.cvs = vectorCanvas;
	this.assets = assets;

	this.fontSize = 60;
	this.boxCornerRadius = 10;

	this.background = {
		offset: new THREE.Vector2(0, 0),
		pos: new THREE.Vector2(0, 0),
		size: new THREE.Vector2(1, 1),
	};

	this.text = {
		offset: new THREE.Vector2(0, 0),
		pos: new THREE.Vector2(0.5, 0.5),
	};

	this.logo = {
		offset: new THREE.Vector2(-300, -384),
		pos: new THREE.Vector2(0.5, 0.5),
		size: new THREE.Vector2(600, 200),
		image: this.assets.images.logo,
	};

	this.children = [];
	this.activePanel = null;

	this.backgroundColor = GS.UIColors.menuBackground;
	this.ingame = false;

	this.visible = true;
};

GS.UIComponents.Menu.prototype = {
	constructor: GS.UIComponents.Menu,

	init: function() {
		this.initTopPanel();
		this.initOptionsPanel();
		this.initGraphicsPanel();
		this.initSoundPanel();
		this.initGameplayPanel();
		this.initControlsPanel();
		this.initCreditsPanel();
		this.initCheatsPanel();
		this.initLevelSelectPanel();
		this.initFooter();

		this.activePanel = this.topPanel;
	},

	initTopPanel: function() {
		var that = this;

		this.topPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 72, 80);

		this.btnNewGame = this.topPanel.addButton("new game");
		this.btnNewGame.onClick = function() { GAME.newGame(); };

		this.btnLevelSelect = this.topPanel.addButton("level select");
		this.btnLevelSelect.onClick = function() { that.activePanel = that.levelSelectPanel; };

		this.btnOptions = this.topPanel.addButton("options");
		this.btnOptions.onClick = function() { that.activePanel = that.optionsPanel; };

		this.btnCredits = this.topPanel.addButton("credits");
		this.btnCredits.onClick = function() { that.activePanel = that.creditsPanel; };
	},

	initOptionsPanel: function() {
		var that = this;

		this.optionsPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 60, 65);

		this.btnGraphics = this.optionsPanel.addButton("graphics");
		this.btnGraphics.onClick = function() { that.activePanel = that.graphicsPanel; }

		this.btnSound = this.optionsPanel.addButton("sound");
		this.btnSound.onClick = function() { that.activePanel = that.soundPanel; }

		this.btnGameplay = this.optionsPanel.addButton("gameplay");
		this.btnGameplay.onClick = function() { that.activePanel = that.gameplayPanel; }

		this.btnControls = this.optionsPanel.addButton("controls");
		this.btnControls.onClick = function() { that.activePanel = that.controlsPanel; }

		this.btnCheats = this.optionsPanel.addButton("cheats");
		this.btnCheats.disabled = true;
		this.btnCheats.onClick = function() { that.activePanel = that.cheatsPanel; }

		this.optionsPanel.addEmptyRow();

		this.btnOptionsBack = this.optionsPanel.addButton("back");
		this.btnOptionsBack.onClick = function() { that.activePanel = that.topPanel; };
	},

	initGraphicsPanel: function() {
		var that = this;

		this.graphicsPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 40, 43);

		this.btnToggleHalfSize = this.graphicsPanel.addToggleButton("half-size rendering");
		this.btnToggleHalfSize.button.currentStateIndex = (GS.Settings.halfSize === true) ? 0 : 1;
		this.btnToggleHalfSize.button.onClick = function(e) { GS.Settings.halfSize = (e.state === "on"); };

		this.graphicsPanel.addEmptyRow();

		this.btnToggleSSAO = this.graphicsPanel.addToggleButton("SSAO");
		this.btnToggleSSAO.button.currentStateIndex = (GS.Settings.ssao === true) ? 0 : 1;
		this.btnToggleSSAO.button.onClick = function(e) { GS.Settings.ssao = (e.state === "on"); };

		this.btnToggleBloom = this.graphicsPanel.addToggleButton("bloom");
		this.btnToggleBloom.button.currentStateIndex = (GS.Settings.bloom === true) ? 0 : 1;
		this.btnToggleBloom.button.onClick = function(e) { GS.Settings.bloom = (e.state === "on"); };

		this.btnToggleNoise = this.graphicsPanel.addToggleButton("noise filter");
		this.btnToggleNoise.button.currentStateIndex = (GS.Settings.noise === true) ? 0 : 1;
		this.btnToggleNoise.button.onClick = function(e) { GS.Settings.noise = (e.state === "on"); };

		this.btnToggleVignette = this.graphicsPanel.addToggleButton("vignette");
		this.btnToggleVignette.button.currentStateIndex = (GS.Settings.vignette === true) ? 0 : 1;
		this.btnToggleVignette.button.onClick = function(e) { GS.Settings.vignette = (e.state === "on"); };

		this.btnToggleFXAA = this.graphicsPanel.addToggleButton("FXAA");
		this.btnToggleFXAA.button.currentStateIndex = (GS.Settings.fxaa === true) ? 0 : 1;
		this.btnToggleFXAA.button.onClick = function(e) { GS.Settings.fxaa = (e.state === "on"); };

		this.graphicsPanel.addEmptyRow();

		this.numberPickerFOV = this.graphicsPanel.addNumberPicker("field of view", GS.Settings.fov, GS.Settings.fovMin, GS.Settings.fovMax, 5);
		this.numberPickerFOV.numberPicker.onChange = function(e) { GS.Settings.fov = e.value; };

		this.btnToggleShowFPS = this.graphicsPanel.addToggleButton("show FPS");
		this.btnToggleShowFPS.button.currentStateIndex = (GS.Settings.showFPS === true) ? 0 : 1;
		this.btnToggleShowFPS.button.onClick = function(e) { GS.Settings.showFPS = (e.state === "on"); };

		this.graphicsPanel.addEmptyRow();

		this.btnGraphicsBack = this.graphicsPanel.addButton("back");
		this.btnGraphicsBack.onClick = function() { that.activePanel = that.optionsPanel; };
	},

	initSoundPanel: function() {
		var that = this;

		this.soundPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 40, 43);

		this.numberPickerSound = this.soundPanel.addNumberPicker("sound volume", GS.Settings.sound, GS.Settings.soundMin, GS.Settings.soundMax, 1);
		this.numberPickerSound.numberPicker.onChange = function(e) { GS.Settings.sound = e.value; };

		this.numberPickerMusic = this.soundPanel.addNumberPicker("music volume", GS.Settings.music, GS.Settings.musicMin, GS.Settings.musicMax, 1);
		this.numberPickerMusic.numberPicker.onChange = function(e) { GS.Settings.music = e.value; };

		this.soundPanel.addEmptyRow();

		this.btnSoundBack = this.soundPanel.addButton("back");
		this.btnSoundBack.onClick = function() { that.activePanel = that.optionsPanel; };
	},

	initGameplayPanel: function() {
		var that = this;

		this.gameplayPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 40, 43);

		this.btnToggleViewBob = this.gameplayPanel.addToggleButton("view bobbing");
		this.btnToggleViewBob.button.currentStateIndex = (GS.Settings.viewBob === true) ? 0 : 1;
		this.btnToggleViewBob.button.onClick = function(e) { GS.Settings.viewBob = (e.state === "on"); };

		this.btnToggleWeaponBob = this.gameplayPanel.addToggleButton("weapon bobbing");
		this.btnToggleWeaponBob.button.currentStateIndex = (GS.Settings.weaponBob === true) ? 0 : 1;
		this.btnToggleWeaponBob.button.onClick = function(e) { GS.Settings.weaponBob = (e.state === "on"); };

		this.gameplayPanel.addEmptyRow();

		this.btnToggleShowHUD = this.gameplayPanel.addToggleButton("show HUD");
		this.btnToggleShowHUD.button.currentStateIndex = (GS.Settings.showHUD === true) ? 0 : 1;
		this.btnToggleShowHUD.button.onClick = function(e) { GS.Settings.showHUD = (e.state === "on"); };

		this.btnToggleShowWeapon = this.gameplayPanel.addToggleButton("show weapon");
		this.btnToggleShowWeapon.button.currentStateIndex = (GS.Settings.showWeapon === true) ? 0 : 1;
		this.btnToggleShowWeapon.button.onClick = function(e) { GS.Settings.showWeapon = (e.state === "on"); };

		this.gameplayPanel.addEmptyRow();

		this.btnGameplayBack = this.gameplayPanel.addButton("back");
		this.btnGameplayBack.onClick = function() { that.activePanel = that.optionsPanel; };
	},

	initCheatsPanel: function() {
		var that = this;

		this.cheatsPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 40, 43);

		this.btnToggleGod = this.cheatsPanel.addToggleButton("god mode");
		this.btnToggleGod.button.currentStateIndex = 1;
		this.btnToggleGod.button.onClick = function(e) { 
			GAME.grid.player.god(); 
			GS.DebugUI.addTempLine("god mode " + e.state);
		};

		this.btnToggleFly = this.cheatsPanel.addToggleButton("fly mode");
		this.btnToggleFly.button.currentStateIndex = 1;
		this.btnToggleFly.button.onClick = function(e) { 
			GAME.grid.player.fly();
			GS.DebugUI.addTempLine("fly mode " + e.state);
		};

		this.btnToggleNoclip = this.cheatsPanel.addToggleButton("noclip mode");
		this.btnToggleNoclip.button.currentStateIndex = 1;
		this.btnToggleNoclip.button.onClick = function(e) { 
			GAME.grid.player.noClip();
			GS.DebugUI.addTempLine("noclip mode " + e.state);
		};

		this.cheatsPanel.addEmptyRow();

		this.btnCheatsGiveAll = this.cheatsPanel.addButton("give ammo and all weapons");
		this.btnCheatsGiveAll.onClick = function() { 
			GAME.grid.player.giveAll();
			GS.DebugUI.addTempLine("all weapons and max ammo given");
		};

		this.cheatsPanel.addEmptyRow();

		this.btnCheatsBack = this.cheatsPanel.addButton("back");
		this.btnCheatsBack.onClick = function() { that.activePanel = that.optionsPanel; };
	},

	initLevelSelectPanel: function() {
		var that = this;

		this.levelSelectPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 60, 140);

		this.btnLevel1 = this.levelSelectPanel.addImageButton("airstrip one", this.assets.images.thumb_airstrip1);
		this.btnLevel1.onClick = function() { GAME.loadLevel("airstrip1"); }
		this.btnLevel1 = this.levelSelectPanel.addImageButton("drencrom", this.assets.images.thumb_drencrom);
		this.btnLevel1.onClick = function() { GAME.loadLevel("drencrom"); }
		this.btnLevel2 = this.levelSelectPanel.addImageButton("sacrosanct", this.assets.images.thumb_sacrosanct);
		this.btnLevel2.onClick = function() { GAME.loadLevel("sacrosanct"); }

		this.levelSelectPanel.fontSize = 40;
		this.levelSelectPanel.rowHeight = 43;

		this.levelSelectPanel.addEmptyRow();

		this.btnLevelSelectBack = this.levelSelectPanel.addButton("back");
		this.btnLevelSelectBack.onClick = function() { that.activePanel = that.topPanel; };
	},

	initControlsPanel: function() {
		var that = this;

		this.controlsPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 28, 31);

		this.btnToggleMouseInvertY = this.controlsPanel.addToggleButton("invert mouse y axis");
		this.btnToggleMouseInvertY.button.currentStateIndex = (GS.Settings.mouseInvertY === true) ? 0 : 1;
		this.btnToggleMouseInvertY.button.onClick = function(e) { GS.Settings.mouseInvertY = (e.state === "on"); };

		this.numberPickerMouse = this.controlsPanel.addNumberPicker("mouse sensitivity", 
			GS.Settings.mouse, GS.Settings.mouseMin, GS.Settings.mouseMax, 1);
		this.numberPickerMouse.numberPicker.onChange = function(e) { GS.Settings.mouse = e.value; };

		this.controlsPanel.addEmptyRow();

		this.btnToggleMoveForward = this.controlsPanel.addToggleButton("move forward", ["W"]);
		this.btnToggleMoveBackward = this.controlsPanel.addToggleButton("move backward", ["S"]);
		this.btnToggleStrafeLeft = this.controlsPanel.addToggleButton("strafe left", ["A"]);
		this.btnToggleStrafeRight = this.controlsPanel.addToggleButton("strafe right", ["D"]);
		this.btnToggleUse = this.controlsPanel.addToggleButton("use", ["E"]);
		this.btnToggleShoot = this.controlsPanel.addToggleButton("shoot", ["mouse left"]);
		this.btnTogglePistol = this.controlsPanel.addToggleButton("pistol", ["2"]);
		this.btnToggleShotgun = this.controlsPanel.addToggleButton("shotgun", ["3"]);
		this.btnToggleHyperBlaster = this.controlsPanel.addToggleButton("hyperblaster", ["4"]);

		this.btnToggleAutomap = this.controlsPanel.addToggleButton("automap", ["TAB"]);
		this.btnToggleAutomap.button.disabled = true;
		this.btnToggleMenu = this.controlsPanel.addToggleButton("menu", ["ESC"]);
		this.btnToggleMenu.button.disabled = true;

		this.controlsPanel.addEmptyRow();

		this.btnControlsBack = this.controlsPanel.addButton("back");
		this.btnControlsBack.onClick = function() { that.activePanel = that.optionsPanel; };

		this.attachReboundEventHandlers();
	},

	attachReboundEventHandlers: function() {
		var keyButtonMap = {
			moveForward: 	this.btnToggleMoveForward,
			moveBackward: 	this.btnToggleMoveBackward,
			strafeLeft: 	this.btnToggleStrafeLeft,
			strafeRight: 	this.btnToggleStrafeRight,
			use: 			this.btnToggleUse,
			shoot: 			this.btnToggleShoot,
			pistol: 		this.btnTogglePistol,
			shotgun: 		this.btnToggleShotgun,
			hyperblaster: 	this.btnToggleHyperBlaster
		};

		for (var i in keyButtonMap) {
			var button = keyButtonMap[i].button;
			button.onClick = getOnClickEventHandler(i);
			button.states = [GS.Keybinds[i].controlName];
			button.currentStateIndex = 0;
		}

		function getOnClickEventHandler(actionName) { 
			return function() {
				GS.KeybindSettings.rebound.modifyKeybind(GS.Keybinds[actionName]);
			}
		}

		GS.KeybindSettings.rebound.onModifyingKeybindStart = function(e) {
			var button = keyButtonMap[e.keybind.actionName].button;
			button.states = ["press new key"];
			button.currentStateIndex = 0;
		};

		GS.KeybindSettings.rebound.onModifyingKeybindStop = function(e) {
			for (var i in keyButtonMap) {
				var button = keyButtonMap[i].button;
				button.states = [GS.Keybinds[i].controlName];
				button.currentStateIndex = 0;
			}

			if (e.success) {
				var button2 = keyButtonMap[e.keybind.actionName].button;
				var onClickEventHandler = button2.onClick;
				button2.onClick = function() {};

				setTimeout(function() {
					button2.onClick = onClickEventHandler;
				}, 100);

				GS.Settings.saveSettings();

				var notifications = GAME.uiManager.notifications;				
				if (notifications) {
					notifications.useText = "[" + GS.Keybinds.use.controlName + "] to use";
					notifications.calculateSizes();
				}
			}
		};
	},

	initCreditsPanel: function() {
		var that = this;

		this.creditsPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 30, 33);

		this.dblLabelCredits1 = this.creditsPanel.addDoubleLabel("code, \"art\"", "sergiu valentin bucur");

		this.creditsPanel.addEmptyRow();

		this.dblLabelCredits23 = this.creditsPanel.addDoubleLabel("music", "DST");
		this.dblLabelCredits24 = this.creditsPanel.addDoubleLabel("", "3uhox");

		this.creditsPanel.addEmptyRow();

		this.dblLabelCredits3 = this.creditsPanel.addDoubleLabel("sound effects", "freesound.org");
		this.dblLabelCredits4 = this.creditsPanel.addDoubleLabel("", "opengameart.org");

		this.creditsPanel.addEmptyRow();

		this.dblLabelCredits5 = this.creditsPanel.addDoubleLabel("skybox texture", "alexcpeterson.com/spacescape");

		this.creditsPanel.addEmptyRow();

		this.dblLabelCredits6 = this.creditsPanel.addDoubleLabel("frameworks", "three.js");
		this.dblLabelCredits7 = this.creditsPanel.addDoubleLabel("", "tween.js");
		this.dblLabelCredits8 = this.creditsPanel.addDoubleLabel("", "jszip");

		this.creditsPanel.addEmptyRow();

		this.btnCreditsBack = this.creditsPanel.addButton("back");
		this.btnCreditsBack.onClick = function() { that.activePanel = that.topPanel; };
	},

	initFooter: function() {
		this.label2 = new GS.UIComponents.MenuLabel(this.cvs, GS.GameVersion,
			new THREE.Vector2(-12, -130), new THREE.Vector2(1, 1));
		this.label2.textAlign = "right";
		this.label2.fontSize = 30;		
		this.children.push(this.label2);

		this.label1 = new GS.UIComponents.MenuLabel(this.cvs, GS.BuildReleaseDate,
			new THREE.Vector2(-12, -95), new THREE.Vector2(1, 1));
		this.label1.textAlign = "right";
		this.label1.fontSize = 30;
		this.children.push(this.label1);

		this.label3 = new GS.UIComponents.MenuLabel(this.cvs, "feedback: timeinvariantgames @ gmail.com",
			new THREE.Vector2(-12, -25), new THREE.Vector2(1, 1));
		this.label3.textAlign = "right";
		this.label3.fontSize = 30;
		this.children.push(this.label3);
	},

	switchToIngame: function() {
		this.ingame = true;
		this.btnCheats.disabled = false;
		this.btnToggleGod.button.currentStateIndex = 1;
		this.btnToggleFly.button.currentStateIndex = 1;
		this.btnToggleNoclip.button.currentStateIndex = 1;
	},

	update: function() {
		this.activePanel.update();

		for (var i = 0; i < this.children.length; i++) {
			this.children[i].update();
		}
	},

	draw: function() {
		if (this.ingame) {
			this.cvs.boxFill(this.background.offset, this.background.pos, this.background.size, false, this.backgroundColor);
		}

		this.cvs.drawImage(this.logo.offset, this.logo.pos, this.logo.image, this.logo.size, true);

		this.activePanel.draw();
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].draw();
		}
	},
};