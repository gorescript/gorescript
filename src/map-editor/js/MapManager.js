GS.SectorTriangleModes = {
	None: 0,
	Rendering: 1,
	Collision: 2,
};

GS.MapManager = function(canvas, ctx) {
	this.canvas = canvas;
	this.ctx = ctx;

	this.map = {
		name: this.generateName(),
		cellSize: 4,
		playerStartPosition: new THREE.Vector2(),
		triangleCount: 0,
	};

	this.map.layerObjectIds = {};
	this.map.layerObjectIds[GS.MapLayers.Segment] = 0;
	this.map.layerObjectIds[GS.MapLayers.Sector] = 0;
	this.map.layerObjectIds[GS.MapLayers.Entity] = 0;
	this.map.layerObjectIds[GS.MapLayers.Zone] = 0;

	this.map.layerObjects = {};
	this.map.layerObjects[GS.MapLayers.Segment] = [];
	this.map.layerObjects[GS.MapLayers.Sector] = [];
	this.map.layerObjects[GS.MapLayers.Entity] = [];
	this.map.layerObjects[GS.MapLayers.Zone] = [];

	this.zoom = {
		value: 1,
		min: 1,
		max: 5,
		speed: 0.5,
	};

	this.defaultOrigin = new THREE.Vector2(768, 448);
	this.offset = new THREE.Vector2(0, 0);
	this.origin = this.defaultOrigin.clone();

	this.showSegmentNormals = true;
	this.snapToGrid = true;

	this.showUserDrawnSegments = true;
	this.showGeneratedInteriorFloorSides = true;
	this.showGeneratedInteriorCeilingSides = true;
	this.showGeneratedExteriorSides = true;	
	this.showTVScreens = true;
	this.sectorTriangleMode = GS.SectorTriangleModes.None;

	this.applyCorrectionsOnImport = true;

	this.entitySize = 8;
};

GS.MapManager.prototype = {
	constructor: GS.MapManager,

	init: function() {
		var that = this;

		this.edgeTool = new GS.EdgeTool(this.map);
	},

	generateName: function() {
		return "random_" + Math.floor(Math.random() * 256);
	},

	modifyZoom: function(value) {
		this.zoom.value += this.zoom.speed * value;
		this.zoom.value = GS.MathHelper.clamp(this.zoom.value, this.zoom.min, this.zoom.max);
	},

	resetZoom: function(value) {
		this.zoom.value = this.zoom.min;
	},

	modifyOrigin: function(dx, dy) {
		this.origin.x -= dx;
		this.origin.y -= dy;
		this.offset.x -= dx;
		this.offset.y -= dy;
	},

	convertToGridCoords: function(v) {
		v.sub(this.origin).add(this.offset).divideScalar(this.zoom.value).add(this.origin);
		return v;
	},

	convertToGridCellCoords: function(v) {
		this.convertToGridCoords(v);
		if (this.snapToGrid) {
			v.x = Math.round(v.x / this.map.cellSize) * this.map.cellSize;
			v.y = Math.round(v.y / this.map.cellSize) * this.map.cellSize;
		}
        return v;
	},

	convertToScreenCoords: function(v) {
		v = v.sub(this.origin).multiplyScalar(this.zoom.value).add(this.origin).sub(this.offset);
		return v;
	},

	drawLayer: function(ctx, layer, selected) {
		switch (layer) {
			case GS.MapLayers.Segment:
				this.drawSegmentLayer(ctx, selected);
				break;
			case GS.MapLayers.Sector:
				this.drawSectorLayer(ctx, selected);
				break;
			case GS.MapLayers.Entity:
				this.drawEntityLayer(ctx, selected);
				break;
			case GS.MapLayers.Zone:
				this.drawZoneLayer(ctx, selected);
				break;
		}
	},

	drawCursorExtensions: function(pos) {
		var crossSize = 8;
		pos = this.convertToScreenCoords(pos.clone());

		this.ctx.save();

		this.ctx.strokeStyle = "#c0c0c0";
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		this.ctx.moveTo(0, pos.y);
		this.ctx.lineTo(this.canvas.width, pos.y);
		this.ctx.moveTo(pos.x, 0);
		this.ctx.lineTo(pos.x, this.canvas.height);
		this.ctx.stroke();
		this.ctx.closePath();

		this.ctx.restore();
	},

	drawCursor: function(pos, extended) {
		var crossSize = 8;
		pos = this.convertToScreenCoords(pos.clone());

		this.ctx.save();

		this.ctx.strokeStyle = "#000";
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.moveTo(pos.x - crossSize, pos.y);
		this.ctx.lineTo(pos.x + crossSize, pos.y);
		this.ctx.moveTo(pos.x, pos.y - crossSize);
		this.ctx.lineTo(pos.x, pos.y + crossSize);
		this.ctx.stroke();
		this.ctx.closePath();

		this.ctx.restore();
	},

	drawSelection: function(start, end) {
		var x0 = Math.min(start.x, end.x);
		var x1 = Math.max(start.x, end.x);
		var y0 = Math.min(start.y, end.y);
		var y1 = Math.max(start.y, end.y);
		var width = x1 - x0;
		var height = y1 - y0;

		this.ctx.save();

		this.ctx.fillStyle = "rgba(0, 128, 255, 0.25)";
		this.ctx.fillRect(x0, y0, width, height);
		this.ctx.strokeStyle = "rgba(0, 128, 255, 1)";
		this.ctx.lineWidth = 1;
		this.ctx.strokeRect(x0, y0, width, height);

		this.ctx.restore();
	},

	forEachLayerObject: function(layer, func) {
		var objList = this.map.layerObjects[layer];
		for (var i = 0; i < objList.length; i++) {
			var obj = objList[i];
			func(obj);
		}
	},

	getLayerObjectCount: function(layer) {
		return this.map.layerObjects[layer].length;
	},

	getLayerObject: function(layer, id) {
		for (var i = 0; i < this.map.layerObjects[layer].length; i++) {
			var obj = this.map.layerObjects[layer][i];
			if (obj.id == id) {
				return obj;
			}
		}
		return undefined;
	},

	constructLayerObject: function(layer, params) {
		var obj = { id: this.map.layerObjectIds[layer]++ };
		$.extend(obj, params);
		return obj;
	},

	addLayerObject: function(layer, obj) {
		this.map.layerObjects[layer].push(obj);
		this.dispatchEvent({ type: "layerObjectCountChange", layer: layer });

		this.map.triangleCount = this.getTriangleCount();
		this.dispatchEvent({ type: "triangleCountChange" });
	},

	removeLayerObject: function(layer, id) {
		this.map.layerObjects[layer] = this.map.layerObjects[layer].filter(function(a) {
			return a.id != id;
		});
		this.dispatchEvent({ type: "layerObjectCountChange", layer: layer });

		this.map.triangleCount = this.getTriangleCount();
		this.dispatchEvent({ type: "triangleCountChange" });
	},

	removeLayerObjects: function(layer, selected) {
		this.map.layerObjects[layer] = this.map.layerObjects[layer].filter(function(a) {
			return selected[a.id] === undefined;
		});
		this.dispatchEvent({ type: "layerObjectCountChange", layer: layer });

		this.map.triangleCount = this.getTriangleCount();
		this.dispatchEvent({ type: "triangleCountChange" });
	},

	getSelectionOfAllLayerObjects: function(layer, condition) {
		condition = condition || function(obj) { return true; };

		var selected = {};
		for (var i = 0; i < this.map.layerObjects[layer].length; i++) {
			var obj = this.map.layerObjects[layer][i];
			if (layer == GS.MapLayers.Segment) {
				if (this.isSegmentVisible(obj)) {
					selected[obj.id] = condition(obj);
				}
			} else {
				selected[obj.id] = condition(obj);
			}
		}

		return selected;
	},

	getLayerObjectsInSelection: function(layer, start, end) {
		start = this.convertToGridCoords(start.clone());
		end = this.convertToGridCoords(end.clone());

		var x0 = Math.min(start.x, end.x);
		var x1 = Math.max(start.x, end.x);
		var y0 = Math.min(start.y, end.y);
		var y1 = Math.max(start.y, end.y);

		var selected = {};
		for (var i = 0; i < this.map.layerObjects[layer].length; i++) {
			var obj = this.map.layerObjects[layer][i];
			if (layer == GS.MapLayers.Segment) {
				if (this.isSegmentVisible(obj) && this.layerObjectIntersectsWithBox(layer, obj, x0, y0, x1, y1)) {
					selected[obj.id] = true;
				}
			} else {
				if (this.layerObjectIntersectsWithBox(layer, obj, x0, y0, x1, y1)) {
					selected[obj.id] = true;
				}
			}
		}

		return selected;
	},

	layerObjectIntersectsWithBox: function(layer, obj, x0, y0, x1, y1) {
		var box = new THREE.Box2().setFromPoints([new THREE.Vector2(x0, y0), new THREE.Vector2(x1, y1)]);

		switch (layer) {
			case GS.MapLayers.Segment:
				return GS.LineHelper.intersectionLineSegmentBox(obj, box);
			case GS.MapLayers.Sector:
				return GS.PolygonHelper.intersectionSectorBox(obj, box);
			case GS.MapLayers.Entity:
				return this.entityIntersectsWithBox(obj, box);
			case GS.MapLayers.Zone:
				return this.zoneIntersectsWithBox(obj, box);
		}
	},

	zoneIntersectsWithBox: function(zone, box1) {
		var box0 = new THREE.Box2().setFromPoints([zone.start, zone.end]);
		return box0.isIntersectionBox(box1);
	},

	entityIntersectsWithBox: function(ntt, box1) {
		var size = this.entitySize;
		var end = ntt.pos.clone().add(new THREE.Vector2(size, size));
		var box0 = new THREE.Box2(ntt.pos, end);
		return box0.isIntersectionBox(box1);
	},
	
	drawSegmentLayer: function(ctx, selected) {
		var getColor = function() { return "#000"; };
		if (selected !== undefined && selected !== {}) {
			getColor = function(obj) { return (selected[obj.id] !== undefined) ? "#0000ff" : "#000"; };
		}

		ctx.save();		
		var segs = this.map.layerObjects[GS.MapLayers.Segment];
		for (var i = 0; i < segs.length; i++) {
			if (!this.isSegmentVisible(segs[i])) {
				continue;
			}

			var seg = segs[i];
			var start = this.convertToScreenCoords(seg.start.clone());
			var end = this.convertToScreenCoords(seg.end.clone());

			ctx.strokeStyle = getColor(seg);
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
			ctx.closePath();
		}
		if (this.showSegmentNormals) {
			this.drawSegmentNormals(ctx, selected);
		}
		ctx.restore();		
	},

	drawSegmentNormals: function(ctx, selected) {
		var getColor = function() { return "#ff00ff"; };
		if (selected !== undefined && selected !== {}) {
			getColor = function(obj) { return (selected[obj.id] !== undefined) ? "#0080ff" : "#ff00ff"; };
		}

		var segs = this.map.layerObjects[GS.MapLayers.Segment];
		for (var i = 0; i < segs.length; i++) {
			var seg = segs[i];

			if (!this.isSegmentVisible(seg)) {
				continue;
			}

			var start = this.convertToScreenCoords(seg.start.clone());
			var end = this.convertToScreenCoords(seg.end.clone());
			
			var normalStart = new THREE.Vector2();
			var normalEnd = new THREE.Vector2().subVectors(end, start);
			var center = normalEnd.clone().divideScalar(2);
			var offset = GS.MathHelper.vec2Normal(normalStart, normalEnd).multiplyScalar(10);

			ctx.strokeStyle = getColor(seg);
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(start.x + center.x, start.y + center.y);
			ctx.lineTo(start.x + center.x + offset.x, start.y + center.y + offset.y);
			ctx.stroke();
			ctx.closePath();
		}
	},

	isSegmentVisible: function(seg) {
		switch (seg.type) {
			case GS.SegmentTypes.User:
				return this.showUserDrawnSegments;
			case GS.SegmentTypes.InteriorFloor:
				return this.showGeneratedInteriorFloorSides;
			case GS.SegmentTypes.InteriorCeiling:
				return this.showGeneratedInteriorCeilingSides;
			case GS.SegmentTypes.Exterior:
				return this.showGeneratedExteriorSides;
			case GS.SegmentTypes.TVScreen:
			case GS.SegmentTypes.Switch:
				return this.showTVScreens;
		}
	},

	drawSegment: function(start, end, color) {
		color = (color !== undefined) ? color: "#000";
		this.ctx.save();

		start = this.convertToScreenCoords(start.clone());
		end = this.convertToScreenCoords(end.clone());

		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.moveTo(start.x, start.y);
		this.ctx.lineTo(end.x, end.y);
		this.ctx.stroke();
		this.ctx.closePath();

		this.ctx.restore();
	},

	isSegmentPointAt: function(pos) {
		var segs = this.map.layerObjects[GS.MapLayers.Segment];
		for (var i = 0; i < segs.length; i++) {
			var seg = segs[i];
			if (seg.start.x == pos.x && seg.start.y == pos.y ||
				seg.end.x == pos.x && seg.end.y == pos.y)
				return true;
		}
		return false;
	},

	convertSegmentsToSectors: function(selected) {
		if (Object.keys(selected).length >= 3) {
			var segments = [];
			for (var i in selected) {
				var seg = this.getLayerObject(GS.MapLayers.Segment, i);				
				segments.push(seg);
			}

			var cellSize = this.snapToGrid ? this.map.cellSize : undefined;
			var result = GS.PolygonHelper.getTriangulatedPolygonsFromLineSegments(segments, cellSize);

			if (result.polygons.length > 0) {
				for (var i = 0; i < result.polygons.length; i++) {
					var polygon = result.polygons[i];
					var sector = this.constructLayerObject(GS.MapLayers.Sector, { 
						vertexArray: polygon.vertexArray,
						vertices: polygon.vertices, 
						indices: polygon.indices,
						floorBottomY: 0,
						floorTopY: 0,
						ceilBottomY: 64,
						ceilTopY: 64,
						ceiling: true,
					});
					this.addLayerObject(GS.MapLayers.Sector, sector);

					this.applySectorDefaults(sector);
				}
			}
		}
	},

	flipSegmentNormals: function(selected) {
		if (Object.keys(selected).length >= 1) {
			for (var i in selected) {
				var seg = this.getLayerObject(GS.MapLayers.Segment, i);
				var aux = seg.start;
				seg.start = seg.end;
				seg.end = aux;
			}
		}
	},

	computeYForEntities: function(selected) {		
		if (Object.keys(selected).length >= 1) {
			for (var i in selected) {
				var ntt = this.getLayerObject(GS.MapLayers.Entity, i);
				var center = ntt.pos.clone().add(new THREE.Vector2(this.entitySize / 2, this.entitySize / 2));

				var sectors = this.map.layerObjects[GS.MapLayers.Sector];
				for (var j = 0; j < sectors.length; j++) {
					if (GS.PolygonHelper.sectorContainsPoint(sectors[j], center)) {
						ntt.y = sectors[j].floorTopY;
						break;
					}
				}
			}
		}
	},

	drawSectorLayer: function(ctx, selected) {
		ctx.save();		

		this.drawSectors(ctx, selected, false);
		this.drawSectors(ctx, selected, true);

		ctx.restore();
	},

	getSectorColor: function() {
		var lineColor = new THREE.Color();
		var fillColor = new THREE.Color();
		var hsl = {};

		return function(sector, selected, drawSelected) {
			if (sector.door === true) {
				lineColor.setRGB(0, 0.75, 1);
				fillColor.setRGB(0, 0.5, 1);
			} else
			if (sector.elevator === true) {
				lineColor.setRGB(1, 1, 0);
				fillColor.setRGB(0.75, 0.75, 0);
			} else {
				lineColor.setRGB(0, 0, 0);
				fillColor.setHex(sector.lightColor);
			}

			fillColor.getHSL(hsl);
			fillColor.setHSL(hsl.h, hsl.s, 0.25 + sector.lightLevel * 0.05);

			if (selected !== undefined && drawSelected) {
				lineColor.setRGB(0, 0.5, 1);
			}

			function toHexStr(color) {
				return "#" + color.getHexString();
			}

			return {
				lineColor: toHexStr(lineColor),
				fillColor: toHexStr(fillColor),
			};
		};
	}(),

	drawSectors: function(ctx, selected, drawSelected) {
		var sectors = this.map.layerObjects[GS.MapLayers.Sector];
		for (var i = 0; i < sectors.length; i++) {
			var sector = sectors[i];

			if (selected !== undefined) {
				if (!drawSelected && selected[sector.id] !== undefined) {
					continue;
				}
				if (drawSelected && selected[sector.id] === undefined) {
					continue;
				}
			}

			var screenCoords = this.convertToScreenCoords(sector.vertices[0].clone());

			ctx.beginPath();
			ctx.moveTo(screenCoords.x, screenCoords.y);
			for (var j = 1; j < sector.vertices.length; j++) {
				var p = sector.vertices[j];
				screenCoords = this.convertToScreenCoords(p.clone());
				ctx.lineTo(screenCoords.x, screenCoords.y);
			}
			ctx.closePath();

			var color = this.getSectorColor(sector, selected, drawSelected);

			ctx.fillStyle = color.fillColor;
			ctx.fill();
			ctx.lineWidth = 3;
			ctx.strokeStyle = color.lineColor;
			ctx.stroke();

			if (this.sectorTriangleMode !== GS.SectorTriangleModes.None) {
				var v, idx;
				if (this.sectorTriangleMode === GS.SectorTriangleModes.Rendering) {
					v = sector.vertices;
					idx = sector.indices;
				} else
				if (this.sectorTriangleMode === GS.SectorTriangleModes.Collision) {
					v = sector.collisionVertices;
					idx = sector.collisionIndices;
				}

				if (v !== undefined) {
					for (var j = 0; j < idx.length; j += 3) {
						var v0 = this.convertToScreenCoords(v[idx[j]].clone());
						var v1 = this.convertToScreenCoords(v[idx[j + 1]].clone());
						var v2 = this.convertToScreenCoords(v[idx[j + 2]].clone());

						ctx.beginPath();
						ctx.moveTo(v0.x, v0.y);
						ctx.lineTo(v1.x, v1.y);
						ctx.lineTo(v2.x, v2.y);
						ctx.closePath();
						ctx.lineWidth = 1;
						ctx.strokeStyle = color.lineColor;
						ctx.stroke();
					}
				}
			}
		}
	},

	drawEntityLayer: function(ctx, selected) {
		ctx.save();
		var entities = this.map.layerObjects[GS.MapLayers.Entity];
		for (var i = 0; i < entities.length; i++) {
			var ntt = entities[i];

			var selectedValue = (selected !== undefined) ? selected[ntt.id] : undefined;
			this.drawEntity(ntt, selectedValue);
		}
		ctx.restore();
	},

	drawEntity: function(ntt, selected) {
		var name = GS.MapEntities[ntt.type].name;		
		var backColor = (selected !== undefined) ? "#0000ff": "#ff0000";
		var textColor = "#ffffff";
		this.ctx.save();

		var entityOffset = 4 * this.zoom.value;

		var size = this.entitySize * this.zoom.value;
		var start = this.convertToScreenCoords(ntt.pos.clone());
		var end = start.clone().add(new THREE.Vector2(size, size));
		var center = start.clone().add(new THREE.Vector2(size / 2, size / 2));		
		var maxWidth = Math.floor((end.x - start.x) * 0.75);

		if (GS.MapEntities[ntt.type].type === "Monster") {
			var normalEnd = new THREE.Vector2(
				size * Math.sin(Math.PI / 180 * (180 - ntt.rotation)), 
				size * Math.cos(Math.PI / 180 * (180 - ntt.rotation))
			).add(center);

			this.ctx.strokeStyle = "#000";
			this.ctx.lineWidth = 3;
			this.ctx.beginPath();
			this.ctx.moveTo(center.x, center.y);
			this.ctx.lineTo(normalEnd.x, normalEnd.y);
			this.ctx.closePath();
			this.ctx.stroke();
		}

		this.ctx.fillStyle = backColor;
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		this.ctx.moveTo(start.x, start.y);
		this.ctx.lineTo(end.x, start.y);
		this.ctx.lineTo(end.x, end.y);
		this.ctx.lineTo(start.x, end.y);
		this.ctx.lineTo(start.x, start.y);
		this.ctx.closePath();
		this.ctx.fill();

		this.ctx.strokeStyle = "#000";
		this.ctx.stroke();

		var fontSize = 12;
		this.ctx.fillStyle = textColor;
		this.ctx.font = fontSize + "px 'Lucida Console', Monaco, monospace";
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";

		var charWidth = this.ctx.measureText(ntt.type).width;
		var numChars = Math.max(1, Math.floor(maxWidth / charWidth));
		name = name.substr(0, numChars);
		this.ctx.fillText(name, center.x, center.y);

		this.ctx.restore();
	},

	isEntityAt: function(pos) {
		var entities = this.map.layerObjects[GS.MapLayers.Entity];
		for (var i = 0; i < entities.length; i++) {
			var ntt = entities[i];
			if (ntt.pos.x == pos.x && ntt.pos.y == pos.y)
				return true;
		}
		return false;
	},

	drawZone: function(start, end) {
		var colors = this.getZoneColors();

		start = this.convertToScreenCoords(start.clone());
		end = this.convertToScreenCoords(end.clone());

		var x0 = Math.min(start.x, end.x);
		var x1 = Math.max(start.x, end.x);
		var y0 = Math.min(start.y, end.y);
		var y1 = Math.max(start.y, end.y);
		var width = x1 - x0;
		var height = y1 - y0;

		this.ctx.save();

		this.ctx.fillStyle = colors.backColor;
		this.ctx.fillRect(x0, y0, width, height);
		this.ctx.strokeStyle = colors.lineColor;
		this.ctx.lineWidth = 1;
		this.ctx.strokeRect(x0, y0, width, height);

		this.ctx.restore();
	},

	getZoneColors: function(zone, selected) {
		var result = {
			backColor: "rgba(0, 128, 0, 0.25)",
			lineColor: "rgba(0, 128, 0, 1)",
		};

		if (selected !== undefined && selected !== {} && selected[zone.id] !== undefined) {
			result.backColor = "rgba(0, 255, 0, 0.25)";
			result.lineColor = "rgba(0, 255, 0, 1)";
		}

		return result;
	},

	drawZoneLayer: function(ctx, selected) {
		ctx.save();		
		var zones = this.map.layerObjects[GS.MapLayers.Zone];
		for (var i = 0; i < zones.length; i++) {
			var zone = zones[i];
			var colors = this.getZoneColors(zone, selected);
			var start = this.convertToScreenCoords(zone.start.clone());
			var end = this.convertToScreenCoords(zone.end.clone());

			var x0 = Math.min(start.x, end.x);
			var x1 = Math.max(start.x, end.x);
			var y0 = Math.min(start.y, end.y);
			var y1 = Math.max(start.y, end.y);
			var width = x1 - x0;
			var height = y1 - y0;

			this.ctx.fillStyle = colors.backColor;
			this.ctx.fillRect(x0, y0, width, height);
			this.ctx.strokeStyle = colors.lineColor;
			this.ctx.lineWidth = 1;
			this.ctx.strokeRect(x0, y0, width, height);
		}
		ctx.restore();
	},

	convertEdgesToSegments: function() {
		var that = this;

		this.edgeTool.computeEdges();

		var all = this.getSelectionOfAllLayerObjects(GS.MapLayers.Segment, function(seg) {
			return (seg.type !== GS.SegmentTypes.TVScreen && seg.type !== GS.SegmentTypes.Switch) ? true : undefined;
		});
		this.removeLayerObjects(GS.MapLayers.Segment, all);
		this.map.layerObjectIds[GS.MapLayers.Segment] = 0;

		function addEdges(edges) {
			for (var i = 0; i < edges.length; i++) {
				edges[i].texId = "wall";
				var segment = that.constructLayerObject(GS.MapLayers.Segment, edges[i]);
				that.addLayerObject(GS.MapLayers.Segment, segment);
			}
		}
		
		addEdges(this.edgeTool.interiorEdges.elements);
		addEdges(this.edgeTool.exteriorEdges.elements);

		GS.PolygonHelper.retriangulateSegments(this.map.layerObjects[GS.MapLayers.Segment]);

		this.map.sectorLinks = this.edgeTool.sectorLinks;
	},

	getTriangleCount: function() {
		var count = 0;

		var segs = this.map.layerObjects[GS.MapLayers.Segment];
		for (var i = 0; i < segs.length; i++) {
			if (segs[i].type !== GS.SegmentTypes.TVScreen && segs[i].type !== GS.SegmentTypes.Switch) {
				count += 2;
			}
		}

		var sectors = this.map.layerObjects[GS.MapLayers.Sector];
		for (var i = 0; i < sectors.length; i++) {
			var sector = sectors[i];
			if (sector.collisionIndices === undefined) {
				continue;
			}

			var hasFloor = (sector.elevator !== true);
			var hasCeiling = (sector.ceiling === true && sector.door !== true);

			if (hasFloor) {
				count += sector.collisionIndices.length / 3;
			}
			if (hasCeiling) {
				count += sector.collisionIndices.length / 3;
			}
			if (sector.door === true) {
				count += sector.collisionIndices.length / 3; // center
				count += sector.collisionVertices.length * 2; // sides
			} else
			if (sector.elevator === true) {
				count += sector.collisionIndices.length / 3; // center
				count += sector.collisionVertices.length * 2; // sides				
			}
		}

		return count;
	},

	importMap: function(jsonStr) {
		var error = false;
		var map;
		try {
			map = JSON.parse(jsonStr, function(k, v) {
				if (v instanceof Object) {
					if (v.x !== undefined && v.y !== undefined && v.z !== undefined) {
						return new THREE.Vector3(v.x, v.y, v.z);
					} else
					if (v.x !== undefined && v.y !== undefined) {
						return new THREE.Vector2(v.x, v.y);
					}
				}
				return v;
			});
		} catch (e) {
			error = true;
			alert("import map error:\n" + e);
		}

		if (error) {
			return;
		}

		map.cellSize = this.map.cellSize;		
		this.map = map;

		if (this.map.playerStartPosition !== undefined) {
			this.origin.copy(this.map.playerStartPosition);
			this.offset.copy(this.origin).sub(this.defaultOrigin);
		}

		this.map.triangleCount = this.getTriangleCount();
		this.dispatchEvent({ type: "triangleCountChange" });

		this.edgeTool.map = this.map;

		if (this.applyCorrectionsOnImport) {
			this.applyMapCorrections();
		}

		this.dispatchEvent({ type: "mapLoad" });
		for (var layer in GS.MapLayers) {
			this.dispatchEvent({ type: "layerObjectCountChange", layer: GS.MapLayers[layer] });
		}
	},

	applySectorDefaults: function(sector) {		
		sector.floorBottomY = sector.floorBottomY || 0;
		sector.floorTopY = sector.floorTopY || 0;
		sector.ceilBottomY = sector.ceilBottomY || 64;
		sector.ceilTopY = sector.ceilTopY || 64;
		sector.ceiling = (sector.ceiling !== undefined) ? sector.ceiling : true;
		sector.door = (sector.door !== undefined) ? sector.door : false;
		sector.doorMaxHeight = (sector.doorMaxHeight !== undefined) ? sector.doorMaxHeight : 16;
		sector.elevator = (sector.elevator !== undefined) ? sector.elevator : false;
		sector.elevatorMaxHeight = (sector.elevatorMaxHeight !== undefined) ? sector.elevatorMaxHeight : 16;
		sector.useVertexColors = false;
		sector.floorTexId = sector.floorTexId || "wall";
		sector.ceilTexId = sector.ceilTexId || "wall";
		sector.sideTexId = sector.sideTexId || "wall";
		sector.lightLevel = (sector.lightLevel !== undefined) ? sector.lightLevel : 5;
		sector.lightColor = (sector.lightColor !== undefined) ? sector.lightColor : 0xffffff;
	},

	applyMapCorrections: function() {
		if (this.map.name === undefined) {
			this.map.name = this.generateName();
		}
		if (this.map.hasScript === undefined) {
			this.map.hasScript = false;
		}

		if (this.map.layerObjects[GS.MapLayers.Zone] === undefined) {
			this.map.layerObjectIds[GS.MapLayers.Zone] = 0;
			this.map.layerObjects[GS.MapLayers.Zone] = [];
		}

		var sectors = this.map.layerObjects[GS.MapLayers.Sector];
		for (var i = 0; i < sectors.length; i++) {
			this.applySectorDefaults(sectors[i]);
		}

		var segments = this.map.layerObjects[GS.MapLayers.Segment];
		for (var i = 0; i < segments.length; i++) {
			var seg = segments[i];
			seg.bottomY = (seg.bottomY !== undefined) ? seg.bottomY : 0;
			seg.topY = (seg.topY !== undefined) ? seg.topY : 64;
			seg.type = (seg.type !== undefined) ? seg.type : GS.SegmentTypes.User;
			seg.texId = seg.texId || "wall";
		}

		var entities = this.map.layerObjects[GS.MapLayers.Entity];
		for (var i = 0; i < entities.length; i++) {
			var ntt = entities[i];
			ntt.y = ntt.y || 0;
			ntt.isStatic = (ntt.isStatic !== undefined) ? ntt.isStatic : false;
			ntt.rotation = ntt.rotation || 0;
		}
	},

	downloadAsZip: function(filename, contentStr) {
		var zip = new JSZip();
		zip.file(filename, contentStr);
		var content = zip.generate();
		location.href = "data:application/zip;base64," + content;
	},

	downloadMap: function() {
		var json = JSON.stringify(this.map);
		this.downloadAsZip("map.js", json);
	},

	getMap: function() {
		return this.map;
	},
};

THREE.EventDispatcher.prototype.apply(GS.MapManager.prototype);