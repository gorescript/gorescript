GS.UIComponents.WinScreen = function(vectorCanvas, assets, player) {
	this.cvs = vectorCanvas;
	this.assets = assets;
	this.player = player;

	this.fontSize = 40;
	this.rowHeight = 45;
	this.boxCornerRadius = 10;

	this.aiManager = player.grid.aiManager;

	this.mapName = "map name";

	this.monstersKilled = 0;
	this.maxMonsters = 0;
	this.itemsPickedUp = 0;
	this.maxItems = 0;
	this.secretsFound = 0;
	this.maxSecrets = 0;
	this.minutes = "00";
	this.seconds = "00";

	this.popup = {
		offset: new THREE.Vector2(-480, -315),
		pos: new THREE.Vector2(0.5, 0.5),
		size: new THREE.Vector2(960, 630),
	};

	this.textOffsetLeft = new THREE.Vector2(-30, -247);
	this.textOffsetRight = new THREE.Vector2(30, -247);
	this.textOffsetCenter = new THREE.Vector2(0, -247);

	this.visible = false;
};

GS.UIComponents.WinScreen.prototype = {
	constructor: GS.UIComponents.WinScreen,

	init: function() {
	},

	update: function() {
		if (!this.visible && this.aiManager.script !== undefined && this.aiManager.script.mapWon) {
			this.collectData();
			this.visible = true;
		}
	},

	collectData: function() {
		var script = this.aiManager.script;

		this.mapName = script.mapName;
		this.monstersKilled = this.aiManager.monstersKilled;
		this.maxMonsters = this.aiManager.maxMonsters;
		this.itemsPickedUp = this.aiManager.itemsPickedUp;
		this.maxItems = this.aiManager.maxItems;
		this.secretsFound = script.secretsFound;
		this.maxSecrets = script.maxSecrets;

		this.minutes = GS.pad(this.aiManager.minutes, 2);
		this.seconds = GS.pad(this.aiManager.seconds, 2);
	},

	draw: function() {
		this.cvs.roundedBoxFill(this.popup.offset, this.popup.pos, this.popup.size, true, 
			this.boxCornerRadius, GS.UIColors.menuBackground);

		this.drawMessage("\"" + this.mapName + "\" complete", 0);

		this.drawField("monsters killed", this.monstersKilled + " / " + this.maxMonsters, 2);
		this.drawField("items picked up", this.itemsPickedUp + " / " + this.maxItems, 3);
		this.drawField("secrets found", this.secretsFound + " / " + this.maxSecrets, 4);

		this.drawField("time spent", this.minutes + ":" + this.seconds, 6);

		this.drawMessage("this concludes the current release", 8);
		this.drawMessage("come back later for more content", 9);

		this.drawMessage("[ENTER] to continue", 11);
	},

	drawField: function() {
		var left = new THREE.Vector2();
		var right = new THREE.Vector2();

		return function(name, value, row) {
			left.copy(this.textOffsetLeft);
			left.y += row * this.rowHeight;
			right.copy(this.textOffsetRight);
			right.y += row * this.rowHeight;

			this.cvs.text(left, this.popup.pos, name, 
				GS.UIColors.foreground, this.fontSize, "middle", "right", GS.UIFont);
			this.cvs.text(right, this.popup.pos, value, 
				GS.UIColors.foreground, this.fontSize, "middle", "left", GS.UIFont);
		}
	}(),

	drawMessage: function() {
		var center = new THREE.Vector2();

		return function(message, row) {
			center.copy(this.textOffsetCenter);
			center.y += row * this.rowHeight;

			this.cvs.text(center, this.popup.pos, message, 
				GS.UIColors.foreground, this.fontSize, "middle", "center", GS.UIFont);
		}
	}(),
};