GS.AIManager = function(grid) {
	this.grid = grid;
	this.map = grid.map;	
};

GS.AIManager.prototype = {
	init: function() {
		var sectorLinks = this.grid.map.sectorLinks;
		if (sectorLinks === undefined) {
			throw "sector links not found";
		}

		this.initZones();
		this.constructSectorGraph(sectorLinks);
		this.assignMonstersToSectors();
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

	constructSectorGraph: function(sectorLinks) {
		this.sectorGraph = new GS.Graph(function(a, b) { return a.id == b.id });
		this.sectorDict = {};

		for (var i = 0; i < sectorLinks.length; i += 2) {
			var s1 = this.getSectorById(sectorLinks[i]);
			var s2 = this.getSectorById(sectorLinks[i + 1]);

			this.sectorDict[s1.id] = { index: -1, sector: s1 };
			this.sectorDict[s2.id] = { index: -1, sector: s2 };

			this.sectorGraph.addEdge(s1, s2);
		}

		var keys = Object.keys(this.sectorDict);
		for (var i = 0; i < keys.length; i++) {
			var obj = this.sectorDict[keys[i]];
			obj.index = this.sectorGraph.getVertexIndex(obj.sector);
		}
		
		this.sectorGraph.computeVertexNeighborSets();
	},

	assignMonstersToSectors: function() {
		this.grid.forEachUniqueGridObject([GS.Monster], function(monster) {
			if (monster.startingSector !== undefined) {
				var sector = monster.startingSector;
				if (sector.inactiveMonsters === undefined) {
					sector.inactiveMonsters = {};
				}
				sector.inactiveMonsters[monster.id] = monster;
			} else {
				throw "monster " + monster.id + " has no starting sector";
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
		}
	},

	update: function() {
		if (this.script !== undefined) {
			this.script.update();
		}
	},

	onPlayerMove: function(player, oldPos, newPos) {
		if (this.script !== undefined) {
			this.checkZones(player, oldPos, newPos);
		}

		this.activateNearbyMonsters(player);
	},

	onPlayerItemPickup: function(player, item) {
		if (this.script !== undefined) {
			this.script.onItemPickup(item);
		}
	},

	onSwitchStateChange: function(switchObj) {
		if (this.script !== undefined) {
			this.script.onSwitchStateChange(switchObj);
		}
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

	activateNearbyMonsters: function(player) {
		if (Object.keys(this.sectorDict).length == 0) {
			return;
		}

		var sector = player.getSector();
		if (sector !== undefined) {
			var visitedIds = {};
			var toVisit = [sector];
			var neighbors, index;

			while (toVisit.length > 0) {
				var currentSector = toVisit.pop();
				visitedIds[currentSector.id] = true;

				if (currentSector.inactiveMonsters !== undefined) {
					this.wakeUpMonstersInSector(currentSector);
				}

				if (currentSector.door === true && currentSector.doorGridObject.state == GS.DoorStates.Closed) {
					continue;
				}

				index = this.sectorDict[currentSector.id].index;
				neighbors = this.sectorGraph.neighborSets[index].elements;
				for (var i = 0; i < neighbors.length; i++) {
					if (!(neighbors[i].id in visitedIds)) {
						toVisit.push(neighbors[i]);
					}
				}
			}
		}
	},

	wakeUpMonstersInSector: function(sector) {
		var keys = Object.keys(sector.inactiveMonsters);
		if (keys.length > 0) {
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				var monster = sector.inactiveMonsters[key];
				monster.activate();
				delete sector.inactiveMonsters[key];
			}
		}
	},

	getSectorById: function(id) {
		var sectors = this.grid.map.layerObjects[GS.MapLayers.Sector];
		for (var i = 0; i < sectors.length; i++) {
			if (sectors[i].id == id) {
				return sectors[i];
			}
		}

		throw "sector " + id + " not found";
	},
};