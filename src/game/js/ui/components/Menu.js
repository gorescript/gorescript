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

		this.initFooter();
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

		this.label4 = new GS.UIComponents.MenuLabel(this.cvs, "open dev tools for cheats",
			new THREE.Vector2(-12, -156), new THREE.Vector2(1, 1));
		this.label4.textAlign = "right";
		this.children.push(this.label4);

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