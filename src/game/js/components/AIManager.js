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
		this.assignConcreteMeshesToRegions();
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
		var that = this;
		this.regionIdCount = 0;

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

		function getNewRegion(doorIds, sectorIds) {
			var region = {
				id: that.regionIdCount,
				doorIds: doorIds || {},
				sectorIds: sectorIds || {},
				monsters: [],
				rootMesh: new THREE.Object3D(),
				needsUpdate: false,
			};

			that.regionIdCount++;			
			return region;
		}

		var regions = [];
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
					regions.push(getNewRegion(seeds[i].doorIds, sectorIds));
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
			var region = getNewRegion();
			for (var i in this.sectorDict) {
				region.sectorIds[i] = true;
			}
			regions.push(region);
		}

		// console.log(regions);
		this.regions = regions;
	},

	assignConcreteMeshesToRegions: function() {
		var that = this;
		this.grid.forEachUniqueGridObject([GS.Concrete], function(gridObject) {
			var region = that.getRegionFromSector(gridObject.sector);
			if (region === undefined) {
				throw "sector not in region";
			}
			region.rootMesh.children.push(gridObject.view.mesh);			
		});

		for (var i = 0; i < this.regions.length; i++) {
			this.regions[i].rootMesh.traverse(function(obj) {
				obj.visible = false;
			});
		}
	},

	assignMonstersToRegions: function() {
		var that = this;
		this.grid.forEachUniqueGridObject([GS.Monster], function(monster) {
			if (monster.startingSector !== undefined) {
				var region = that.getRegionFromSector(monster.startingSector);
				if (region === undefined) {
					throw "sector not in region";
				}
				region.monsters.push(monster);
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
			if (!region.rootMesh.visible) {
				that.setRegionVisibility(region, true);				
			}
			visibleRegions++;
		});

		for (var i = 0; i < this.regions.length; i++) {
			var region = this.regions[i];
			if (region.rootMesh.visible && !region.reachedThisFrame) {
				this.setRegionVisibility(region, false);
			}
		}

		// GS.DebugUI.setStaticLine("total regions", this.regions.length);
		// GS.DebugUI.trackNumericValue("visible regions", visibleRegions);
	},

	setRegionVisibility: function(region, value) {
		region.rootMesh.traverse(function(obj) {
			obj.visible = value;
		});
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
			var toVisit = [ this.getRegionFromSector(sector) ];
			var visited = {};
			while (toVisit.length > 0) {
				var region = toVisit.pop();

				if (region.id in visited) {
					continue;
				}
				visited[region.id] = true;

				callback(region);
				for (var i = 0; i < region.linkedRegions.length; i++) {
					var linked = region.linkedRegions[i];
					var sector = this.sectorDict[linked.doorId].sector;

					if (sector.doorGridObject.state !== GS.DoorStates.Closed) {
						toVisit.push(linked.region);
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