GS.UIComponents = GS.UIComponents || {};

GS.UIManager = function() {
	this.reset();
	this.menuActive = false;
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
		}

		this.menu = new GS.UIComponents.Menu(this.vectorCanvas, this.assets);
		this.menu.init();

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
		if (!this.menuActive) {
			if (!this.hidden && this.checkIfRedraw()) {
				this.cvs.clear();

				for (var i = 0; i < this.components.length; i++) {
					if (this.components[i].visible) {
						this.components[i].draw();
						this.components[i].needsRedraw = false;
					}
				}

				this.cvs.flip();
			}
		} else {
			this.cvs.clear();

			this.menu.draw();

			this.cvs.flip();
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

	onResize: function() {
		this.overrideRedraw = true;
		this.vectorCanvas.onResize();
	},

	dispose: function() {
		this.cvs.dispose();
	},
};