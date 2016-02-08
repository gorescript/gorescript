GS.UIComponents = GS.UIComponents || {};

GS.UIManager = function() {
	this.reset();
	this.menuOnly = true;
	this.menuActive = false;

	this.menuBackOffset = new THREE.Vector2(0, 0);
	this.menuBackPos = new THREE.Vector2(0, 0);
	this.menuBackSize = new THREE.Vector2(1, 1);

	this.showHUD = GS.Settings.showHUD;
};

GS.UIManager.prototype = {
	constructor: GS.UIManager,

	reset: function() {
		this.grid = undefined;
		this.hidden = true;
	},

	init: function() {
		this.cvs = new GS.Canvas2d(true);

		this.cvs.alpha = 0;
		this.cvs.canvasId = "ui-canvas";
		this.cvs.redrawOnResize = false;

		this.cvs.init();
		this.cvs.screenCanvas.style.zIndex = 30;

		this.vectorCanvas = new GS.VectorCanvas(this.cvs);
		this.vectorCanvas.init();
	},

	initComponents: function(assets, grid) {
		this.grid = grid;
		this.assets = {
			images: assets[GS.AssetTypes.UIWidget],
		};
		this.components = [];

		if (this.grid !== undefined) {
			this.powerBars = new GS.UIComponents.PowerBars(this.vectorCanvas, this.assets, this.grid.player);
			this.powerBars.init();
			this.components.push(this.powerBars);

			this.crosshair = new GS.UIComponents.Crosshair(this.vectorCanvas, this.assets, this.grid.player);
			this.crosshair.init();
			this.components.push(this.crosshair);

			this.notifications = new GS.UIComponents.Notifications(this.vectorCanvas, this.assets, this.grid.player);
			this.notifications.init();
			this.components.push(this.notifications);

			this.winScreen = new GS.UIComponents.WinScreen(this.vectorCanvas, this.assets, this.grid.player);
			this.winScreen.init();
			this.components.push(this.winScreen);

			this.automap = new GS.UIComponents.Automap(this.vectorCanvas, this.assets, this.grid.player);
			this.automap.init();
			this.components.push(this.automap);
		}

		if (this.menu === undefined) {
			this.menu = new GS.UIComponents.Menu(this.vectorCanvas, this.assets);
			this.menu.init();
		}

		this.overrideRedraw = true;
	},

	show: function() {
		this.overrideRedraw = true;
		this.cvs.show();
		this.hidden = false;
	},

	hide: function() {
		this.cvs.hide();
		this.hidden = true;
	},

	update: function() {
		for (var i = 0; i < this.components.length; i++) {
			this.components[i].update();
		}

		if (this.menuActive) {
			this.menu.update();
		}
	},

	draw: function() {
		if (this.menuActive) {
			this.cvs.clear();

			if (this.menuOnly) {
				this.vectorCanvas.drawImage(this.menuBackOffset, this.menuBackPos, this.assets.images.menu_back, this.menuBackSize, false);
			}
			this.menu.draw();

			this.cvs.flip();
		} else
		if (this.winScreen.visible) {
			this.cvs.clear();
			this.winScreen.draw();
			this.cvs.flip();
		} else
		if (this.automap.visible) {
			if (this.overrideRedraw || this.automap.needsRedraw) {
				if (this.overrideRedraw) {
					this.overrideRedraw = false;
				}

				this.cvs.clear();
				this.automap.draw();
				this.automap.needsRedraw = false;
				this.cvs.flip();
			}
		} else {
			if (!this.hidden && this.checkIfRedraw()) {
				this.cvs.clear();

				if (this.showHUD) {
					for (var i = 0; i < this.components.length; i++) {
						if (this.components[i].visible) {
							this.components[i].draw();
							this.components[i].needsRedraw = false;
						}
					}
				}

				this.cvs.flip();
			}
		}
	},

	checkIfRedraw: function() {
		if (this.overrideRedraw) {
			this.overrideRedraw = false;
			return true;
		}

		for (var i = 0; i < this.components.length; i++) {
			if (this.components[i].visible && this.components[i].needsRedraw) {
				return true;
			}
		}

		return false;
	},

	removeNewsBox: function() {
		this.menu.removeNewsBox();
	},

	useIngameMenu: function() {
		this.menuOnly = false;
		this.menu.switchToIngame();
	},

	onResize: function() {
		this.overrideRedraw = true;
		this.vectorCanvas.onResize();

		GS.InputHelper.screenRatioX = this.cvs.bufferCanvas.width / window.innerWidth;
		GS.InputHelper.screenRatioY = this.cvs.bufferCanvas.height / window.innerHeight;
	},

	dispose: function() {
		this.grid = undefined;
		this.powerBars = undefined;
		this.crosshair = undefined;
		this.notifications = undefined;
		this.winScreen = undefined;
		this.components = [];
	},
};