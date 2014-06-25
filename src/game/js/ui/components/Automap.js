GS.UIComponents.Automap = function(vectorCanvas, assets, player) {
	this.cvs = vectorCanvas;
	this.assets = assets;
	this.player = player;
	this.aiManager = player.grid.aiManager;

	this.background = {
		offset: new THREE.Vector2(0, 0),
		pos: new THREE.Vector2(0, 0),
		size: new THREE.Vector2(1, 1),
	};

	this.playerDraw = {
		offset: new THREE.Vector2(0, 0),
		pos: new THREE.Vector2(0.5, 0.5),
	};

	this.mapDraw = {
		offset: new THREE.Vector2(0, 0),
		pos: new THREE.Vector2(0.5, 0.5),
	};

	this.backgroundColor = GS.UIColors.menuBackground;

	this.oldRegionsDiscovered = Object.keys(this.aiManager.regionsDiscovered).length;
	this.oldPlayerPosition = this.player.position.toVector2();
	this.currentPlayerPosition = this.player.position.toVector2();
	this.oldPlayerDirection = this.player.direction.toVector2();
	this.currentPlayerDirection = this.player.direction.toVector2();

	this.zoom = 2.5;

	this.visible = false;
};

GS.UIComponents.Automap.prototype = {
	constructor: GS.UIComponents.Automap,

	init: function() {
	},

	update: function() {
		var regionsDiscovered = Object.keys(this.aiManager.regionsDiscovered).length;
		if (regionsDiscovered > this.oldRegionsDiscovered) {
			this.needsRedraw = true;
			this.oldRegionsDiscovered = regionsDiscovered;
		}

		this.player.position.toVector2(this.currentPlayerPosition);
		if (!this.currentPlayerPosition.equalsEpsilon(this.oldPlayerPosition)) {
			this.needsRedraw = true;
			this.oldPlayerPosition.copy(this.currentPlayerPosition);
		}

		this.player.direction.toVector2(this.currentPlayerDirection);
		if (!this.currentPlayerDirection.equalsEpsilon(this.oldPlayerDirection)) {
			this.needsRedraw = true;
			this.oldPlayerDirection.copy(this.currentPlayerDirection);
		}
	},

	draw: function() {
		this.cvs.boxFill(this.background.offset, this.background.pos, this.background.size, false, this.backgroundColor);

		var regionsDiscovered = this.aiManager.regionsDiscovered;
		for (var i in regionsDiscovered) {
			this.drawRegion(regionsDiscovered[i]);
		}

		this.drawPlayer();
	},

	drawPlayer: function() {
		var p0 = new THREE.Vector2();
		var p1 = new THREE.Vector2();
		var p2 = new THREE.Vector2();
		var aux = new THREE.Vector2();
		var color = "rgba(192, 192, 192, 1)";

		return function() {
			var size = this.player.size.x * this.zoom;
			var xAngle = this.player.xAngle;

			p0.x = size * Math.sin(Math.PI / 180 * (360 + 90 - xAngle));
			p0.y = size * Math.cos(Math.PI / 180 * (360 + 90 - xAngle));
			p1.x = size * Math.sin(Math.PI / 180 * (210 + 90 - xAngle));
			p1.y = size * Math.cos(Math.PI / 180 * (210 + 90 - xAngle));
			p2.x = size * Math.sin(Math.PI / 180 * (150 + 90 - xAngle));
			p2.y = size * Math.cos(Math.PI / 180 * (150 + 90 - xAngle));

			this.cvs.fixedLine(this.mapDraw.pos, p0, p1, color, 3);
			this.cvs.fixedLine(this.mapDraw.pos, p1, p2, color, 3);
			this.cvs.fixedLine(this.mapDraw.pos, p2, p0, color, 3);
		}
	}(),

	drawRegion: function() {
		var p0 = new THREE.Vector2();
		var p1 = new THREE.Vector2();
		var wallColor = "rgba(64, 64, 64, 1)";
		var doorColor = "rgba(128, 0, 0, 1)";

		return function(region) {
			var that = this;

			function drawSectorLine(sector, x0, x1, color, lineWidth) {
				p0.copy(sector.collisionVertices[x0]);
				p1.copy(sector.collisionVertices[x1]);
				p0.sub(that.currentPlayerPosition).multiplyScalar(that.zoom);
				p1.sub(that.currentPlayerPosition).multiplyScalar(that.zoom);
				p1.sub(p0);

				that.cvs.line(p0, that.mapDraw.pos, p1, true, color, lineWidth);
			}

			var sectorDict = this.aiManager.sectorDict;
			for (var i in region.sectorIds) {
				var sector = sectorDict[i].sector;

				if (sector.door) {
					continue;
				}

				for (var j = 0; j < sector.collisionVertices.length - 1; j++) {
					drawSectorLine(sector, j, j + 1, wallColor, 1);
				}
				drawSectorLine(sector, j, 0, wallColor, 1);
			}

			for (var i in region.sectorIds) {
				var sector = sectorDict[i].sector;

				if (!sector.door || !sector.doorOpenedEver) {
					continue;
				}

				for (var j = 0; j < sector.collisionVertices.length - 1; j++) {
					drawSectorLine(sector, j, j + 1, doorColor, 3);
				}
				drawSectorLine(sector, j, 0, doorColor, 3);
			}
		}
	}(),
};