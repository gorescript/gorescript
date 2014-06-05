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
		this.initFooter();

		this.activePanel = this.topPanel;
	},

	initTopPanel: function() {
		var that = this;

		this.topPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 60, 65);

		this.btnNewGame = this.topPanel.addButton("new game");
		this.btnNewGame.onClick = function() { window.newGame(); };

		this.btnSaveGame = this.topPanel.addButton("save game");
		this.btnSaveGame.disabled = true;

		this.btnLoadGame = this.topPanel.addButton("load game");
		this.btnLoadGame.disabled = true;

		this.btnOptions = this.topPanel.addButton("options");
		this.btnOptions.onClick = function() { that.activePanel = that.optionsPanel; };

		this.btnCredits = this.topPanel.addButton("credits");
		this.btnCredits.disabled = true;
	},

	initOptionsPanel: function() {
		var that = this;

		this.optionsPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 60, 65);

		this.btnGraphics = this.optionsPanel.addButton("graphics");
		this.btnGraphics.onClick = function() { that.activePanel = that.graphicsPanel; }

		this.btnSound = this.optionsPanel.addButton("sound");
		this.btnSound.disabled = true;
		this.btnSound.onClick = function() { that.activePanel = that.soundPanel; }

		this.btnGameplay = this.optionsPanel.addButton("gameplay");
		this.btnGameplay.onClick = function() { that.activePanel = that.gameplayPanel; }

		this.btnControls = this.optionsPanel.addButton("controls");
		this.btnControls.disabled = true;
		this.btnControls.onClick = function() { that.activePanel = that.controlsPanel; }

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

		this.btnGameplayBack = this.gameplayPanel.addButton("back");
		this.btnGameplayBack.onClick = function() { that.activePanel = that.optionsPanel; };
	},

	initControlsPanel: function() {
		var that = this;

		this.controlsPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 40, 43);

		this.btnControlsBack = this.controlsPanel.addButton("back");
		this.btnControlsBack.onClick = function() { that.activePanel = that.optionsPanel; };
	},

	initFooter: function() {
		this.label1 = new GS.UIComponents.MenuLabel(this.cvs, "WASD + mouse to move/shoot",
			new THREE.Vector2(-12, -316), new THREE.Vector2(1, 1));
		this.label1.textAlign = "right";
		this.children.push(this.label1);

		this.label2 = new GS.UIComponents.MenuLabel(this.cvs, "2, 3, 4 to switch between weapons",
			new THREE.Vector2(-12, -276), new THREE.Vector2(1, 1));
		this.label2.textAlign = "right";
		this.children.push(this.label2);

		this.label3 = new GS.UIComponents.MenuLabel(this.cvs, "ESC to open this menu",
			new THREE.Vector2(-12, -236), new THREE.Vector2(1, 1));
		this.label3.textAlign = "right";
		this.children.push(this.label3);

		if (!GS.isIFrame) {
			this.label4 = new GS.UIComponents.MenuLabel(this.cvs, "open dev tools for cheats",
				new THREE.Vector2(-12, -156), new THREE.Vector2(1, 1));
			this.label4.textAlign = "right";
			this.children.push(this.label4);
		}

		this.label5 = new GS.UIComponents.MenuLabel(this.cvs, "works best in Chrome 34+",
			new THREE.Vector2(-12, -76), new THREE.Vector2(1, 1));
		this.label5.textAlign = "right";
		this.children.push(this.label5);

		this.label6 = new GS.UIComponents.MenuLabel(this.cvs, "pre-alpha · timeinvariant.com",
			new THREE.Vector2(-12, -36), new THREE.Vector2(1, 1));
		this.label6.textAlign = "right";
		this.children.push(this.label6);
	},

	update: function() {
		this.activePanel.update();

		for (var i = 0; i < this.children.length; i++) {
			this.children[i].update();
		}
	},

	draw: function() {
		this.cvs.boxFill(this.background.offset, this.background.pos, this.background.size, false, GS.UIColors.menuBackground);
		this.cvs.drawImage(this.logo.offset, this.logo.pos, this.logo.image, this.logo.size, true);

		this.activePanel.draw();

		for (var i = 0; i < this.children.length; i++) {
			this.children[i].draw();
		}
	},
};