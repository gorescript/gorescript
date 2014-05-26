GS.EdgeTool = function(map) {
	this.map = map;

	this.equals = function(a, b) {
		return (a.type == b.type &&
				(a.start.equalsEpsilon(b.start) && a.end.equalsEpsilon(b.end) ||
				a.end.equalsEpsilon(b.start) && a.start.equalsEpsilon(b.end)));
	};

	this.interiorEdges = new GS.Set(undefined, this.equals);
	this.exteriorEdges = new GS.Set(undefined, this.equals);
};

GS.EdgeTool.prototype = {
	computeEdges: function() {
		this.interiorEdges.elements = [];
		this.exteriorEdges.elements = [];

		GS.PolygonHelper.retriangulateSectors(this.map.layerObjects[GS.MapLayers.Sector]);
		GS.PolygonHelper.detriangulateSectors(this.map.layerObjects[GS.MapLayers.Sector]);

		this.sectorLinks = new GS.Set(undefined, function(a, b) {
			return (a.start == b.start && a.end == b.end ||
			 		a.end == b.start && a.start == b.end);
		});

		var edges = new GS.Set(undefined, function(a, b) {
			if (a.sector.id == b.sector.id) {
				return (a.start.equalsEpsilon(b.start) && a.end.equalsEpsilon(b.end) ||
						a.end.equalsEpsilon(b.start) && a.start.equalsEpsilon(b.end));
			} else {
				return false;
			}
		});
		var sectors = this.map.layerObjects[GS.MapLayers.Sector];
		for (var i = 0; i < sectors.length; i++) {
			var sector = sectors[i];
			this.addSectorEdges(sector, edges);
		}

		this.processEdges(edges);

		var links = [];
		for (var i = 0; i < this.sectorLinks.elements.length; i++) {
			var link = this.sectorLinks.elements[i];
			links.push(link.start, link.end);
		}

		this.sectorLinks = links;
	},

	addSectorEdges: function(sector, edges) {
		var that = this;
		var v = sector.vertices;
		var sectors = that.map.layerObjects[GS.MapLayers.Sector];

		function addEdge(i, j) {
			var edge = { start: v[i], end: v[j], sector: sector };
			edges.add(edge);
		}
		
		for (var i = 0; i < v.length - 1; i++) {
			addEdge(i, i + 1);
		}
		addEdge(v.length - 1, 0);
	},

	processEdges: function(edges) {
		for (var i = 0; i < edges.elements.length; i++) {
			var edge = edges.elements[i];

			var sharedEdge = false;
			var adjacentSector = null;
			for (var j = 0; j < edges.elements.length; j++) {
				if (i != j && this.equals(edge, edges.elements[j])) {
					sharedEdge = true;
					adjacentSector = edges.elements[j].sector;
					break;
				}
			}

			if (sharedEdge) {
				this.sectorLinks.add({ start: edge.sector.id, end: adjacentSector.id });

				this.addInteriorFloorEdge(edge.start, edge.end, edge.sector, adjacentSector);
				this.addInteriorCeilEdge(edge.start, edge.end, edge.sector, adjacentSector);
			} else {
				this.addExteriorEdge(edge.start, edge.end, edge.sector);
			}
		}
	},

	addInteriorFloorEdge: function(start, end, sector, adjacentSector) {
		var currentSector = adjacentSector;
		var edge = { start: start, end: end, type: GS.SegmentTypes.InteriorFloor };

		if (adjacentSector.floorTopY > sector.floorTopY) {
			var aux = edge.start;
			edge.start = edge.end;
			edge.end = aux;
			currentSector = sector;
		}

		edge.bottomY = Math.min(adjacentSector.floorTopY, sector.floorTopY);
		edge.topY = Math.max(adjacentSector.floorTopY, sector.floorTopY);

		edge.sectorId = currentSector.id;

		if (edge.bottomY != edge.topY) {
			this.interiorEdges.add(edge);
		}
	},

	addInteriorCeilEdge: function(start, end, sector, adjacentSector) {
		var currentSector = adjacentSector;
		var edge = { start: start, end: end, type: GS.SegmentTypes.InteriorCeiling };

		if (adjacentSector.ceilBottomY < sector.ceilBottomY) {
			var aux = edge.start;
			edge.start = edge.end;
			edge.end = aux;
			currentSector = sector;
		}

		if (adjacentSector.ceiling && sector.ceiling) {
			edge.bottomY = Math.min(adjacentSector.ceilBottomY, sector.ceilBottomY);
			edge.topY = Math.max(adjacentSector.ceilBottomY, sector.ceilBottomY);
		} else {
			if (adjacentSector.ceiling && adjacentSector.ceilBottomY < adjacentSector.ceilTopY) {
				edge.bottomY = adjacentSector.ceilBottomY;
				edge.topY = adjacentSector.ceilTopY;

				var aux = edge.start;
				edge.start = edge.end;
				edge.end = aux;
				currentSector = sector;
			} else
			if (sector.ceiling && sector.ceilBottomY < sector.ceilTopY) {
				edge.bottomY = sector.ceilBottomY;
				edge.topY = sector.ceilTopY;
			}
		}

		edge.sectorId = currentSector.id;

		if (edge.bottomY != edge.topY) {
			this.interiorEdges.add(edge);
		}
	},

	addExteriorEdge: function(start, end, sector) {
		var edge = { start: end, end: start, sectorId: sector.id, type: GS.SegmentTypes.Exterior };

		edge.bottomY = sector.floorTopY;
		edge.topY = sector.ceilBottomY;

		this.exteriorEdges.add(edge);
	},
};