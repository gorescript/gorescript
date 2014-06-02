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

	this.visible = true;
};

GS.UIComponents.Menu.prototype = {
	constructor: GS.UIComponents.Menu,

	init: function() {
		this.topPanel = new GS.UIComponents.MenuPanel(this.cvs, new THREE.Vector2(-400, -160), 
			new THREE.Vector2(0.5, 0.5), new THREE.Vector2(800, 520), 60, 65);

		this.btnNewGame = this.topPanel.addButton("new game");
		this.btnNewGame.onClick = function() { window.newGame(); };

		this.btnSaveGame = this.topPanel.addButton("save game");
		this.btnSaveGame.disabled = true;

		this.btnLoadGame = this.topPanel.addButton("load game");
		this.btnLoadGame.disabled = true;

		this.btnOptions = this.topPanel.addButton("options");
		this.btnOptions.disabled = true;

		this.btnCredits = this.topPanel.addButton("credits");
		this.btnCredits.disabled = true;

		this.children.push(this.topPanel);
	},

	update: function() {
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].update();
		}
	},

	draw: function() {
		this.cvs.boxFill(this.background.offset, this.background.pos, this.background.size, false, GS.UIColors.menuBackground);
		this.cvs.drawImage(this.logo.offset, this.logo.pos, this.logo.image, this.logo.size, true);

		for (var i = 0; i < this.children.length; i++) {
			this.children[i].draw();
		}
	},
};