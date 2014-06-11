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
		this.constructRegions();
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

	constructSectorGraph: function(sectorLinks) {
		this.sectorGraph = new GS.Graph(function(a, b) { return a.id == b.id });
		this.sectorDict = {};

		for (var i = 0; i < sectorLinks.length; i += 2) {
			var s1 = this.getSectorById(sectorLinks[i]);
			var s2 = this.getSectorById(sectorLinks[i + 1]);

			this.sectorDict[s1.id] = { index: -1, sector: s1, center: GS.PolygonHelper.getSectorCentroid(s1) };
			this.sectorDict[s2.id] = { index: -1, sector: s2, center: GS.PolygonHelper.getSectorCentroid(s2) };

			this.sectorGraph.addEdge(s1, s2);
		}

		var keys = Object.keys(this.sectorDict);
		for (var i = 0; i < keys.length; i++) {
			var obj = this.sectorDict[keys[i]];
			obj.index = this.sectorGraph.getVertexIndex(obj.sector);
		}
		
		this.sectorGraph.computeVertexNeighborSets();
	},

	constructRegions: function() {
		var toVisit = [];
		var doorCount = 0;
		var seeds = {};
		for (var i in this.sectorDict) {
			if (this.sectorDict[i].sector.door) {
				var neighbors = this.sectorGraph.neighborSets[this.sectorDict[i].index].elements;
				for (var j = 0; j < neighbors.length; j++) {
					var id = neighbors[j].id;
					toVisit.push({ id: id, seed: id });
					seeds[id] = { doorIds: {}, sectorIds: {} };
				}
				doorCount++;
			}
		}

		regions = [];
		if (doorCount > 0) {
			var visited = {};
			while (toVisit.length > 0) {
				var current = toVisit.pop();
				var id = current.id;
				var seedId = current.seed;

				if (this.sectorDict[id].sector.door) {
					seeds[seedId].doorIds[id] = true;
				}
				if (visited[id]) {
					continue;
				}					

				visited[id] = true;
				seeds[seedId].sectorIds[id] = true;

				if (this.sectorDict[id].sector.door) {
					continue;
				}

				var neighbors = this.sectorGraph.neighborSets[this.sectorDict[id].index].elements;
				for (var i = 0; i < neighbors.length; i++) {
					var info = this.sectorDict[neighbors[i].id];
					var id = info.sector.id;
					toVisit.push({ id: id, seed: seedId });
				}
			}

			// var totalCount = Object.keys(this.sectorDict).length;
			// var visitedCount = Object.keys(visited).length;
			// console.log("total sectors", totalCount);
			// console.log("visited", visitedCount);
			// console.log("doors", doorCount);
			// console.log("coverage " + ((visitedCount / totalCount) * 100).toFixed(2) + "%");

			// var seedCoverage = 0;
			// for (var i in seeds) {
			// 	var sectorIds = seeds[i].sectorIds;
			// 	seedCoverage += Object.keys(sectorIds).length;
			// }
			// console.log("seed coverage " + ((seedCoverage / visitedCount) * 100).toFixed(2) + "%");

			for (var i in seeds) {
				var sectorIds = seeds[i].sectorIds;
				if (Object.keys(sectorIds).length > 0) {
					regions.push({ doorIds: seeds[i].doorIds, sectorIds: sectorIds, inactiveMonsters: {} });
				}
			}

			for (var i = 0; i < regions.length; i++) {
				var region = regions[i];
				region.linkedRegions = [];
				for (var j in region.doorIds) {
					for (var k = 0; k < regions.length; k++) {
						if (k !== i) {	
							var region2 = regions[k];
							for (var e in region2.doorIds) {
								if (e === j) {
									region.linkedRegions.push({ doorId: e, region: region2 });
									break;
								}
							}
						}
					}
				}
			}
		} else {
			var region = { doorIds: {}, sectorIds: {}, linkedRegions: [], inactiveMonsters: {} };
			for (var i in sectorDict) {
				region.sectorIds[i] = true;
			}
			regions.push(region);
		}

		// console.log(regions);
		this.regions = regions;
	},

	assignMonstersToRegions: function() {
		var that = this;
		this.grid.forEachUniqueGridObject([GS.Monster], function(monster) {
			if (monster.startingSector !== undefined) {
				var region = that.getRegionFromSector(monster.startingSector);
				if (region === undefined) {
					throw "sector not in region";
				}
				region.inactiveMonsters[monster.id] = monster;
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
		var sector = player.getSector();
		if (sector !== undefined) {
			var region = this.getRegionFromSector(sector);
			this.wakeUpMonsters(region);

			for (var i = 0; i < region.linkedRegions.length; i++) {
				var linked = region.linkedRegions[i];
				var sector = this.sectorDict[linked.doorId].sector;

				if (sector.doorGridObject.state !== GS.DoorStates.Closed) {
					this.wakeUpMonsters(linked.region);
				}
			}
		}
	},

	wakeUpMonsters: function(region) {
		var keys = Object.keys(region.inactiveMonsters);
		if (keys.length > 0) {
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				var monster = region.inactiveMonsters[key];
				monster.activate();
				delete region.inactiveMonsters[key];
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

	getRegionFromSector: function(sector) {
		for (var i = 0; i < this.regions.length; i++) {
			var region = this.regions[i];
			if (sector.id in region.sectorIds) {
				return region;
			}
		}
		return undefined;
	},
};