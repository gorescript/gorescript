GS.AIManager = function(grid) {
	this.grid = grid;
	this.map = grid.map;
	this.mapWon = false;

	this.monstersKilled = 0;
	this.maxMonsters = 0;
	this.itemsPickedUp = 0;
	this.maxItems = 0;

	this.lastFrameTime = performance.now();
	this.timeSpent = 0;
	this.minutes = 0;
	this.seconds = 0;

	this.regionsDiscovered = {};
};

GS.AIManager.prototype = {
	init: function() {
		this.initZones();

		this.sectorDict = this.grid.regionInfo.sectorDict;
		this.regions = this.grid.regionInfo.regions;

		for (var i = 0; i < this.regions.length; i++) {
			this.regions[i].mesh.visible = false;
		}

		this.assignMonstersToRegions();
		this.initGridObjectLibrary();
		this.initScripts();
	},

	initZones: function() {
		this.zones = this.map.layerObjects[GS.MapLayers.Zone];
		for (var i = 0; i < this.zones.length; i++) {
			var zone = this.zones[i];
			zone.boundingSquare = new THREE.Box2().setFromPoints([zone.start, zone.end]);
		}
	},

	assignMonstersToRegions: function() {
		var that = this;
		this.grid.forEachUniqueGridObject([GS.Monster], function(monster) {
			if (monster.startingSector !== undefined) {
				var region = that.getRegionBySectorId(monster.startingSector.id);
				if (region === undefined) {
					GAME.handleFatalError("sector not in region");
					return;
				}
				region.monsters.push(monster);
			} else {
				GAME.handleFatalError("monster " + monster.id + " has no starting sector");
				return;
			}
		});
	},

	initGridObjectLibrary: function() {
		var that = this;

		var library = {
			items: {},
			doors: {},
			elevators: {},
			monsters: {},
			sectors: {},
			switches: {},
		};

		this.grid.forEachUniqueGridObject([GS.Item, GS.Door, GS.Elevator, GS.Monster, GS.Concrete, GS.Switch], function(gridObject) {
			if (gridObject instanceof GS.Item) {
				library.items[gridObject.sourceObj.id] = gridObject;
			} else
			if (gridObject instanceof GS.Door) {
				library.doors[gridObject.sector.id] = gridObject;
			} else
			if (gridObject instanceof GS.Elevator) {
				library.elevators[gridObject.sector.id] = gridObject;
			} else
			if (gridObject instanceof GS.Monster) {
				library.monsters[gridObject.sourceObj.id] = gridObject;
			} else
			if (gridObject instanceof GS.Concrete && gridObject.type == GS.MapLayers.Sector) {
				library.sectors[gridObject.sourceObj.id] = gridObject;
			} else
			if (gridObject instanceof GS.Switch) {
				library.switches[gridObject.segment.id] = gridObject;
			}
		});

		this.gridObjectLibrary = library;
	},

	initScripts: function() {
		if (this.map.hasScript === true) {
			this.script = new GS.MapScripts[this.map.name](this.gridObjectLibrary);
			this.script.init();

			var entities = this.grid.map.layerObjects[GS.MapLayers.Entity];
			for (var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				var type = GS.MapEntities[entity.type].type;
				if (type === "Monster") {
					this.maxMonsters++;
				} else
				if (type === "Item") {
					this.maxItems++;
				}
			}
		}
	},

	update: function() {
		if (this.script !== undefined) {
			this.script.update();

			if (this.script.mapWon && !this.mapWon) {
				this.mapWon = true;
			}
		}

		if (!this.mapWon) {
			this.updateTime();
		}
	},

	updateTime: function() {
		if (!this.grid.player.inMenu) {
			this.timeSpent += performance.now() - this.lastFrameTime;
			this.minutes = Math.floor(Math.floor(this.timeSpent) / 60000);
			this.seconds = Math.floor(Math.floor(this.timeSpent) / 1000 - this.minutes * 60);
		}
		this.lastFrameTime = performance.now();

		// GS.DebugUI.setStaticLine("time spent", GS.pad(this.minutes, 2) + ":" + GS.pad(this.seconds, 2));
	},

	resume: function() {
		this.lastFrameTime = performance.now();
	},

	onMonsterDeath: function() {
		this.monstersKilled++;
	},

	onPlayerMove: function(player, oldPos, newPos) {
		if (this.script !== undefined) {
			this.checkZones(player, oldPos, newPos);
		}

		this.wakeUpNearbyMonsters(player);
		this.applyRegionVisibility(player);
	},

	onPlayerShoot: function(player) {
		this.activateNearbyMonsters(player);
	},

	onPlayerOpenDoor: function(door) {
		if (this.script !== undefined) {
			this.script.onPlayerOpenDoor(door);
		}
	},

	onPlayerItemPickup: function(player, item) {
		this.itemsPickedUp++;

		if (this.script !== undefined) {
			this.script.onItemPickup(item);
		}
	},

	onSwitchStateChange: function(switchObj) {
		if (this.script !== undefined) {
			this.script.onSwitchStateChange(switchObj);
		}
	},

	applyRegionVisibility: function(player) {
		var that = this;

		for (var i = 0; i < this.regions.length; i++) {
			this.regions[i].reachedThisFrame = false;
		}

		var visibleRegions = 0;
		this.propagateRegions(player, function(region) {
			region.reachedThisFrame = true;
			region.mesh.visible = true;
			visibleRegions++;
		});

		for (var i = 0; i < this.regions.length; i++) {
			var region = this.regions[i];
			if (region.mesh.visible && !region.reachedThisFrame) {
				region.mesh.visible = false;
			}
		}

		// GS.DebugUI.setStaticLine("total regions", this.regions.length);
		// GS.DebugUI.trackNumericValue("visible regions", visibleRegions);
	},

	checkZones: function() {
		var oldPos2d = new THREE.Vector2();
		var newPos2d = new THREE.Vector2();

		return function(player, oldPos, newPos) {
			oldPos.toVector2(oldPos2d);
			newPos.toVector2(newPos2d);

			for (var i = 0; i < this.zones.length; i++) {
				var zone = this.zones[i];
				var c1 = zone.boundingSquare.containsPoint(oldPos2d);
				var c2 = zone.boundingSquare.containsPoint(newPos2d);

				if (c1 && !c2) {
					this.script.onZoneLeave(zone);
				} else
				if (!c1 && c2) {
					this.script.onZoneEnter(zone);
				}
			}
		}
	}(),

	wakeUpNearbyMonsters: function(player) {
		var that = this;
		this.propagateRegions(player, function(region) { that.wakeUpMonsters(region); });
	},

	activateNearbyMonsters: function(player) {
		var that = this;
		this.propagateRegions(player, function(region) { that.activateMonsters(region); });
	},

	propagateRegions: function(player, callback) {
		var sector = player.getSector();

		if (sector !== undefined) {
			var toVisit = [ this.getRegionBySectorId(sector.id) ];
			var visited = {};

			while (toVisit.length > 0) {
				var region = toVisit.pop();

				if (region.id in visited) {
					continue;
				}
				visited[region.id] = true;
				this.regionsDiscovered[region.id] = region;

				callback(region);
				if (region.linkedRegions !== undefined) {
					for (var i = 0; i < region.linkedRegions.length; i++) {
						var linked = region.linkedRegions[i];
						var sector = this.sectorDict[linked.doorId].sector;

						if (sector.doorGridObject.state !== GS.DoorStates.Closed) {
							toVisit.push(linked.region);
						}
					}
				}
			}
		}
	},

	wakeUpMonsters: function(region) {
		if (region.awake) {
			return;
		}

		for (var i = 0; i < region.monsters.length; i++) {
			region.monsters[i].wakeUp();
		}
		region.awake = true;
	},

	activateMonsters: function(region) {
		if (region.active) {
			return;
		}

		for (var i = 0; i < region.monsters.length; i++) {
			region.monsters[i].activate();
		}
		region.active = true;
	},

	getRegionBySectorId: function(sectorId) {
		for (var i = 0; i < this.regions.length; i++) {
			var region = this.regions[i];
			if (sectorId in region.sectorIds) {
				return region;
			}
		}

		GAME.handleFatalError("sector has no corresponding region");
	},
};