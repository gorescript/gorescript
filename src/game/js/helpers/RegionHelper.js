GS.RegionHelper = function() {
	this.material = new GS.MeshVertexColorMaterial();
};

GS.RegionHelper.prototype = {
	constructor: GS.RegionHelper,

	getRegions: function(sectors, sectorLinks) {
		var result = this.getSectorGraph(sectors, sectorLinks);
		result.regions = this.constructRegions(result.sectorDict, result.sectorGraph);
		return result;
	},

	getSectorGraph: function(sectors, sectorLinks) {
		var sectorGraph = new GS.Graph(function(a, b) { return a.id == b.id });
		var sectorDict = {};

		for (var i = 0; i < sectorLinks.length; i += 2) {
			var s1 = this.getSectorById(sectors, sectorLinks[i]);
			var s2 = this.getSectorById(sectors, sectorLinks[i + 1]);

			sectorDict[s1.id] = { index: -1, sector: s1, center: GS.PolygonHelper.getSectorCentroid(s1) };
			sectorDict[s2.id] = { index: -1, sector: s2, center: GS.PolygonHelper.getSectorCentroid(s2) };

			sectorGraph.addEdge(s1, s2);
		}

		var keys = Object.keys(sectorDict);
		for (var i = 0; i < keys.length; i++) {
			var obj = sectorDict[keys[i]];
			obj.index = sectorGraph.getVertexIndex(obj.sector);
		}

		sectorGraph.computeVertexNeighborSets();

		return {
			sectorGraph: sectorGraph,
			sectorDict: sectorDict,
		};
	},

	constructRegions: function(sectorDict, sectorGraph) {
		this.regionIdCount = 0;

		var toVisit = [];
		var doorCount = 0;
		var seeds = {};

		for (var i in sectorDict) {
			if (sectorDict[i].sector.door) {
				var neighbors = sectorGraph.neighborSets[sectorDict[i].index].elements;
				for (var j = 0; j < neighbors.length; j++) {
					var id = neighbors[j].id;
					toVisit.push({ id: id, seed: id });
					seeds[id] = { doorIds: {}, sectorIds: {} };
				}
				doorCount++;
			}
		}

		var regions = [];
		if (doorCount > 0) {
			var visited = {};

			while (toVisit.length > 0) {
				var current = toVisit.pop();
				var id = current.id;
				var seedId = current.seed;

				if (sectorDict[id].sector.door) {
					seeds[seedId].doorIds[id] = true;
				}
				if (visited[id]) {
					continue;
				}

				visited[id] = true;
				seeds[seedId].sectorIds[id] = true;

				if (sectorDict[id].sector.door) {
					continue;
				}

				var neighbors = sectorGraph.neighborSets[sectorDict[id].index].elements;
				for (var i = 0; i < neighbors.length; i++) {
					var info = sectorDict[neighbors[i].id];
					var id = info.sector.id;
					toVisit.push({ id: id, seed: seedId });
				}
			}

			for (var i in seeds) {
				var sectorIds = seeds[i].sectorIds;
				if (Object.keys(sectorIds).length > 0) {
					regions.push(this.getNewRegion(seeds[i].doorIds, sectorIds));
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
			var region = this.getNewRegion();
			for (var i in this.sectorDict) {
				region.sectorIds[i] = true;
			}
			regions.push(region);
		}

		return regions;
	},

	getNewRegion: function(doorIds, sectorIds) {
		var region = {
			id: this.regionIdCount,
			doorIds: doorIds || {},
			sectorIds: sectorIds || {},
			monsters: []
		};

		var mesh = new THREE.Mesh(new THREE.Geometry(), this.material);
		mesh.matrixAutoUpdate = false;
		region.mesh = mesh;

		this.regionIdCount++;
		return region;
	},

	getSectorById: function(sectors, id) {
		for (var i = 0; i < sectors.length; i++) {
			if (sectors[i].id == id) {
				return sectors[i];
			}
		}

		GAME.handleFatalError("sector " + id + " not found");
		return;
	},
};