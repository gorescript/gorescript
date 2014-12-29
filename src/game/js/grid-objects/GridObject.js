GS.GridObject = function(grid, layer, sourceObj) {
	this.id = GS.gridObjectIdCount;
	this.grid = grid;
	this.type = layer;
	this.sourceObj = sourceObj;
	this.linkedGridCells = [];
	this.view = null;

	this.removed = false;
	this.usable = false;

	this.lightLevelFactor = 0.1;
	this.minLightLevel = 0.1;
	this.maxLightLevel = 0.75;

	GS.gridObjectIdCount++;
};

GS.GridObject.prototype = {
	constructor: GS.GridObject,

	init: function() {
	},

	update: function() {
	},

	updateCollisionData: function(newPos) {
	},

	updateBoundingBox: function() {
		var min = new THREE.Vector3();
		var max = new THREE.Vector3();
		var points = [ new THREE.Vector2(), new THREE.Vector2() ];
		var aux = new THREE.Vector2();

		return function() {
			var data = this.view.collisionData;
			min.copy(this.position).sub(this.size);
			max.copy(this.position).add(this.size);
			data.boundingBox.set(min, max);

			var debugMesh = this.view.debugMesh;
			if (debugMesh !== undefined) {
				if (debugMesh.userData.isTriangleMesh !== true) {
					debugMesh.scale.subVectors(max, min);
					debugMesh.position.copy(this.position);
				} else {
					debugMesh.geometry.vertices.length = 0;
					GS.pushArray(debugMesh.geometry.vertices, data.triangles);
					debugMesh.geometry.verticesNeedUpdate = true;
				}
			}

			if (data.boundingSquare !== undefined) {
				this.size.toVector2(aux);
				this.position.toVector2(points[0]);
				points[0].sub(aux);
				this.size.toVector2(aux);
				this.position.toVector2(points[1]);
				points[1].add(aux);

				data.boundingSquare.setFromPoints(points);
			}
		}
	}(),

	updateTriangles: function(velocity) {
		var triangles = this.view.collisionData.triangles;
		for (var i = 0; i < triangles.length; i++) {
			triangles[i].add(velocity);
		}
	},

	updateSegments: function(yVelocity) {
		var segs = this.view.collisionData.segments;
		for (var i = 0; i < segs.length; i++) {
			segs[i].bottomY += yVelocity;
			segs[i].topY += yVelocity;
		}
	},

	assignToCells: function(gridLocation) {
		if (gridLocation !== undefined) {
			if (this.gridLocation !== undefined) {
				if (!gridLocation.gridMin.equals(this.gridLocation.gridMin) ||
					!gridLocation.gridMax.equals(this.gridLocation.gridMax)) {

					this.unlinkFromCells();
					this.linkToCells(gridLocation);
				}
			} else {
				this.linkToCells(gridLocation);
			}
		} else {
			this.unlinkFromCells();
		}
	},

	linkToCells: function(gridLocation) {
		var min = gridLocation.gridMin;
		var max = gridLocation.gridMax;

		for (var i = min.y; i <= max.y; i++) {
			for (var j = min.x; j <= max.x; j++) {
				this.grid.cells[i][j].children.push(this);
				this.linkedGridCells.push(this.grid.cells[i][j]);
			}
		}

		this.gridLocation = gridLocation;
	},

	unlinkFromCells: function() {
		for (var i = 0; i < this.linkedGridCells.length; i++) {
			var cell = this.linkedGridCells[i];
			var idx = cell.children.indexOf(this);
			if (idx != -1) {
				cell.children.splice(idx, 1);
			}
		}
		this.linkedGridCells.length = 0;
		this.gridLocation = undefined;
	},

	getLightColorFromSector: function(optionalTarget, optionalSector) {
		var sector = optionalSector || this.getSector();
		if (sector !== undefined) {
			var color = optionalTarget || new THREE.Color();
			var x = (sector.lightLevel * this.lightLevelFactor);
			x *= x;
			x = GS.MathHelper.clamp(x, this.minLightLevel, this.maxLightLevel);
			color.setHex(0xffffff).multiplyScalar(x);
		}
	},

	computeYFromSector: function() {
		var sector = this.getSector();
		if (sector !== undefined) {
			this.position.y = sector.floorTopY + this.size.y + 0.03;
		}
	},

	getSector: function() {
		var position2d = new THREE.Vector2();

		return function() {
			var that = this;

			var sector;
			var currentSector;
			this.position.toVector2(position2d);

			this.grid.forEachUniqueGridObjectInCells(this.linkedGridCells, [GS.Concrete, GS.Elevator], function(gridObject) {
				if (sector === undefined) {
					if (gridObject instanceof GS.Concrete) {
						if (gridObject.type === GS.MapLayers.Sector) {
							currentSector = gridObject.sourceObj;
						} else {
							return;
						}
					} else {
						currentSector = gridObject.sector;
					}

					if (GS.PolygonHelper.sectorContainsPoint(currentSector, position2d, true)) {
						sector = currentSector;
					}
				}
			});

			return sector;
		}
	}(),

	onHit: function() {
	},

	remove: function() {
		this.removed = true;
		this.unlinkFromCells();
	},
};

GS.gridObjectIdCount = 0;