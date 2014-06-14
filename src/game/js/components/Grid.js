GS.Grid = function(renderer, scene) {
	this.renderer = renderer;
	this.scene = scene;

	this.concreteMeshes = new THREE.Object3D();
	this.entityMeshes = new THREE.Object3D();

	this.stopMonsters = false;

	this.debugEntityMeshes = false;
	this.debugConcreteMeshes = false;
	this.debugCellLines = false;
};

GS.Grid.prototype = {
	constructor: GS.Grid,

	init: function() {
		this.addConcreteMeshesToScene();
		this.addEntityMeshesToScene();

		this.particleView = new GS.ParticleView(this);
		this.particleView.init();

		this.collisionManager = new GS.CollisionManager(this);
		this.collisionManager.init();

		this.lightingView = new GS.LightingView(this);
		this.lightingView.init();

		this.forEachUniqueGridObject(undefined, function(gridObject) {
			gridObject.init();
		});

		this.aiManager = new GS.AIManager(this);
		this.aiManager.init();

		if (this.debugCellLines) {
			this.addDebugCellLines();
		}
	},

	initSkybox: function(skyboxMesh) {
		this.skybox = {
			mesh: skyboxMesh,
			scene: new THREE.Scene(),
			camera: new THREE.PerspectiveCamera(GS.Settings.fov, window.innerWidth / window.innerHeight, 1, 2000),
		}
		this.skybox.scene.add(skyboxMesh);
	},

	update: function() {
		var that = this;

		this.particleView.update();
		this.lightingView.update();
		this.aiManager.update();

		this.totalCollisionTriangles = 0;

		var projectileCount = 0;
		var itemCount = 0;
		var activeMonsterCount = 0;

		this.forEachUniqueGridObject(undefined, function(gridObject) {
			if (gridObject instanceof GS.Monster) {
				if (!that.stopMonsters) {
					gridObject.update();
				}
			} else {
				gridObject.update();
			}
		});

		if (this.player.linkedGridCells.length == 0) {
			this.player.update();
		}

		var rotationMatrix = new THREE.Matrix4().extractRotation(this.player.camera.matrixWorld);
		this.skybox.camera.rotation.setFromRotationMatrix(rotationMatrix, this.skybox.camera.rotation.order);

		// GS.DebugUI.trackNumericValue("total collision triangles", this.totalCollisionTriangles);
	},

	addConcreteMeshesToScene: function() {
		var that = this;
		this.forEachUniqueGridObject([GS.Concrete], function(gridObject) {
			if (that.debugConcreteMeshes) {
				gridObject.view.mesh.children.push(gridObject.view.debugMesh);
			}

			gridObject.view.mesh.userData.gridObject = gridObject;
			that.concreteMeshes.children.push(gridObject.view.mesh);
		});

		this.scene.add(this.concreteMeshes);
	},

	addEntityMeshesToScene: function() {
		var that = this;
		this.forEachUniqueGridObject([GS.Item, GS.Monster, GS.Door, GS.Elevator, GS.TVScreen, GS.Switch], function(gridObject) {
			if (that.debugEntityMeshes && gridObject.view.debugMesh !== undefined) {
				gridObject.view.mesh.children.push(gridObject.view.debugMesh);
			}

			that.entityMeshes.children.push(gridObject.view.mesh);
		});

		this.scene.add(this.entityMeshes);

		// if (this.debugEntityMeshes) {
		// 	this.scene.add(this.player.view.debugMesh);
		// }
	},

	addDebugLine: function(pos0, pos1, color) {
		color = (color !== undefined) ? color: 0xffffff;

		var geometry = new THREE.Geometry();
		geometry.vertices.push(pos0);
		geometry.vertices.push(pos1);
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.Line(geometry, material);
		this.scene.add(line);
	},

	addDebugCellLines: function() {
		var height = 2;
		var color = new THREE.Color().setRGB(0, 0, 0.5).getHex();

		var geometry = new THREE.PlaneGeometry(this.width * this.cellSize, this.height * this.cellSize, this.width, this.height);		
		var material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.rotation.x = -Math.PI / 2;

		var v = this.map.bounds.min.clone().multiplyScalar(-1);
		v.sub(this.map.bounds.max.clone().sub(this.map.bounds.min).divideScalar(2));
		mesh.position.x = -v.x;
		mesh.position.y = height;
		mesh.position.z = -v.y;

		this.scene.add(mesh);
	},

	addProjectile: function(sourceGridObject, type, position, direction) {
		var projectile = new GS.Projectile(this, sourceGridObject, type, position, direction);
		projectile.init();

		if (this.debugEntityMeshes) {
			projectile.view.debugMesh = new THREE.Mesh(
				new THREE.BoxGeometry(1, 1, 1),
				new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
			);

			this.scene.add(projectile.view.debugMesh);
		}

		this.lightingView.addProjectileLight(projectile);
	},

	addEnvironmentImpactParticles: function(position, normal, color, n) {
		n = n || 5;
		for (var i = 0; i < n; i++) {
			var particle = this.particleView.addParticle(1, 1, 1, color, GS.ParticleMovementTypes.Falling, position);
			this.particleView.alignParticleTrajectoryToNormal(particle, normal);
			particle.mesh.position.copy(position);
		}
	},

	addEntityImpactParticles: function(position, color, n) {
		n = n || 3;
		for (var i = 0; i < n; i++) {
			var particle = this.particleView.addParticle(1, 1, 1, color, GS.ParticleMovementTypes.Gushing, position);
			particle.mesh.position.copy(position);
		}
	},

	getMeshFromBox2: function(box2, material) {
		var geometry = new THREE.Geometry();

		geometry.vertices.push(new THREE.Vector3(box2.min.x, 0, box2.min.y));
		geometry.vertices.push(new THREE.Vector3(box2.max.x, 0, box2.min.y));
		geometry.vertices.push(new THREE.Vector3(box2.min.x, 0, box2.max.y));
		geometry.vertices.push(new THREE.Vector3(box2.max.x, 0, box2.max.y));

		geometry.faces.push(new THREE.Face3(0, 1, 2));
		geometry.faces.push(new THREE.Face3(1, 3, 2));

		var mesh = new THREE.Mesh(geometry, material);
		return mesh;
	},

	addDebugGridLocation: function(gridLocation) {
		var material = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
		var mesh = this.getMeshFromBox2(gridLocation.box2, material);
		this.scene.add(mesh);
	},

	forEachUniqueGridObjectInCells: function(cells, types, callback) {
		var gridObjects = {};

		if (types !== undefined && types.length > 0) {
			for (var i = 0; i < cells.length; i++) {
				var cell = cells[i];

				for (var k = 0; k < cell.children.length; k++) {
					var gridObject = cell.children[k];
					for (var e = 0; e < types.length; e++) {
						if (gridObject instanceof types[e]) {
							gridObjects[gridObject.id] = gridObject;
						}
					}
				}
			}
		} else {
			for (var i = 0; i < cells.length; i++) {
				var cell = cells[i];

				for (var k = 0; k < cell.children.length; k++) {
					var gridObject = cell.children[k];
					gridObjects[gridObject.id] = gridObject;
				}
			}
		}

		Object.keys(gridObjects).forEach(function(key) {
			callback(gridObjects[key]);
		});
	},

	forEachUniqueGridObject: function(types, callback) {
		var gridObjects = {};

		if (types !== undefined && types.length > 0) {
			for (var i = 0; i < this.height; i++) {
				for (var j = 0; j < this.width; j++) {
					var cell = this.cells[i][j];

					for (var k = 0; k < cell.children.length; k++) {
						var gridObject = cell.children[k];
						for (var e = 0; e < types.length; e++) {
							if (gridObject instanceof types[e]) {
								gridObjects[gridObject.id] = gridObject;
							}
						}
					}
				}
			}
		} else {
			for (var i = 0; i < this.height; i++) {
				for (var j = 0; j < this.width; j++) {
					var cell = this.cells[i][j];

					for (var k = 0; k < cell.children.length; k++) {
						var gridObject = cell.children[k];
						gridObjects[gridObject.id] = gridObject;
					}
				}
			}
		}

		Object.keys(gridObjects).forEach(function(key) {
			callback(gridObjects[key]);
		});
	},

	removeEntityMesh: function(mesh) {
		this.entityMeshes.remove(mesh);
	},

	isPointInMapBounds: function(point) {
		return this.map.bounds.containsPoint(point);
	},

	getGridLocationFromPoints: function(points) {
		var box2 = new THREE.Box2().setFromPoints(points);

		if (this.map.bounds.isIntersectionBox(box2)) {
			var gridMin = this.getGridCoords(box2.min);
			var gridMax = this.getGridCoords(box2.max);

			gridMin.x = GS.MathHelper.clamp(gridMin.x, 0, this.width - 1);
			gridMin.y = GS.MathHelper.clamp(gridMin.y, 0, this.height - 1);
			gridMax.x = GS.MathHelper.clamp(gridMax.x, 0, this.width - 1);
			gridMax.y = GS.MathHelper.clamp(gridMax.y, 0, this.height - 1);

			return {
				box2: box2,
				gridMin: gridMin,
				gridMax: gridMax,
			}
		} else {
			return undefined;
		}
	},

	getGridCoords: function(point) {
		var p = point.clone().sub(this.map.bounds.min);
		p.x = Math.floor(p.x / this.cellSize);
		p.y = Math.floor(p.y / this.cellSize);
		return p;
	},

	getCellsFromGridLocation: function(gridLocation) {
		var cells = [];

		var min = gridLocation.gridMin;
		var max = gridLocation.gridMax;

		for (var i = min.y; i <= max.y; i++) {
			for (var j = min.x; j <= max.x; j++) {
				cells.push(this.cells[i][j]);
			}
		}

		return cells;
	},

	getTriangleIterator: function(gridLocation, types, condition) {
		var that = this;
		var cells = that.getCellsFromGridLocation(gridLocation);

		if (condition === undefined) {
			return function(callback) {
				that.forEachUniqueGridObjectInCells(cells, types, function(gridObject) {
					var triangles = gridObject.view.collisionData.triangles;

					for (var i = 0; i < triangles.length; i += 3) {
						callback(gridObject, triangles[i], triangles[i + 1], triangles[i + 2], i);
					}
				});
			}
		}

		return function(callback) {
			that.forEachUniqueGridObjectInCells(cells, types, function(gridObject) {
				if (condition(gridObject)) {
					var triangles = gridObject.view.collisionData.triangles;

					for (var i = 0; i < triangles.length; i += 3) {
						callback(gridObject, triangles[i], triangles[i + 1], triangles[i + 2], i);
					}
				}
			});
		}
	},

	getSegmentIterator: function(gridLocation, condition) {
		var that = this;
		var cells = that.getCellsFromGridLocation(gridLocation);

		if (condition === undefined) {
			return function(callback) {
				that.forEachUniqueGridObjectInCells(cells, [GS.Concrete, GS.Elevator, GS.Door], function(gridObject) {
					if (gridObject instanceof GS.Concrete && gridObject.type === GS.MapLayers.Segment) {
						callback(gridObject.sourceObj);
					} else
					if (gridObject instanceof GS.Elevator || gridObject instanceof GS.Door) {
						var segs = gridObject.view.collisionData.segments;
						for (var i = 0; i < segs.length; i++) {
							callback(segs[i]);
						}
					}
				});
			}
		}

		return function(callback) {
			that.forEachUniqueGridObjectInCells(cells, [GS.Concrete, GS.Elevator, GS.Door], function(gridObject) {
				if (gridObject instanceof GS.Concrete && gridObject.type === GS.MapLayers.Segment) {
					if (condition(gridObject.sourceObj)) {
						callback(gridObject.sourceObj);
					}
				} else
				if (gridObject instanceof GS.Elevator || gridObject instanceof GS.Door) {
					var segs = gridObject.view.collisionData.segments;
					for (var i = 0; i < segs.length; i++) {
						if (condition(segs[i])) {
							callback(segs[i]);
						}
					}
				}
			});
		}
	},

	clearScene: function() {
		for (var i = this.scene.children.length - 1; i >= 0; i--) {
			var obj = this.scene.children[i];
			this.scene.remove(obj);
		}
	},

	onResize: function() {
		this.skybox.camera.aspect = window.innerWidth / window.innerHeight;
		this.skybox.camera.updateProjectionMatrix();
	},

	updateFov: function() {
		this.skybox.camera.fov = GS.Settings.fov;
		this.skybox.camera.updateProjectionMatrix();
	},

	getSingleObjectMapOBJ: function() {
		var exporter = new THREE.OBJExporter();
		var geometry = new THREE.Geometry();

		var v = this.map.bounds.min.clone().multiplyScalar(-1);
		v.sub(this.map.bounds.max.clone().sub(this.map.bounds.min).divideScalar(2));
		var matrix = new THREE.Matrix4().makeTranslation(v.x, 0, v.y);		

		var addMesh = function(mesh) {
			var meshGeo = mesh.geometry.clone();
			meshGeo.applyMatrix(matrix);
			THREE.GeometryUtils.merge(geometry, meshGeo);
		};

		for (var i = 0; i < this.concreteMeshes.children.length; i++) {
			var mesh = this.concreteMeshes.children[i];
			
			if (mesh.children.length > 0) {
				for (var j = 0; j < mesh.children.length; j++) {
					addMesh(mesh.children[j]);
				}
			} else {
				addMesh(mesh);
			}
		}

		return exporter.parse(geometry);		
	},

	exportMapToOBJ: function() {
		var lightBuckets = {};

		var v = this.map.bounds.min.clone().multiplyScalar(-1);
		v.sub(this.map.bounds.max.clone().sub(this.map.bounds.min).divideScalar(2));
		var matrix = new THREE.Matrix4().makeTranslation(v.x, 0, v.y);

		var color = new THREE.Color();
		function addMesh(gridObject, mesh) {
			var lightLevel = gridObject.sector.lightLevel;
			var lightColor = gridObject.sector.lightColor;
			var key = color.setHex(lightColor).getHexString() + GS.pad(lightLevel.toFixed(0), 2);

			if (!(key in lightBuckets)) {
				lightBuckets[key] = {
					lightLevel: lightLevel,
					lightColor: lightColor,
					geometry: new THREE.Geometry(),
				};
			}

			var geometry = mesh.geometry.clone();
			geometry.applyMatrix(matrix);
			THREE.GeometryUtils.merge(lightBuckets[key].geometry, geometry);
		}

		function colorToString(color) {
			return color.r.toFixed(6) + " " + color.g.toFixed(6) + " " + color.b.toFixed(6);
		}

		function getEmissiveColor(lightLevel) {
			if (lightLevel < 10) {
				return 0;
			}
			return lightLevel / 10;
		}

		for (var i = 0; i < this.concreteMeshes.children.length; i++) {
			var mesh = this.concreteMeshes.children[i];
			var gridObject = mesh.userData.gridObject;
			
			if (mesh.children.length > 0) {
				for (var j = 0; j < mesh.children.length; j++) {
					addMesh(gridObject, mesh.children[j]);
				}
			} else {
				addMesh(gridObject, mesh);
			}
		}

		var exporter = new THREE.OBJExporter();

		var specularHardness = 96.07;
		var refractionIndex = 1;
		var transparency = 1;
		var illum = 2;
		var ambient = new THREE.Color().setRGB(0, 0, 0);
		var diffuse = new THREE.Color().setRGB(1, 1, 1);
		var specular = new THREE.Color().setRGB(0.5, 0.5, 0.5);

		var str = "mtllib map.mtl\n";
		var mtl = "";
		var j = 0;
		var faceIndexOffset = 0;
		for (var i in lightBuckets) {
			str += "o Mesh" + j + "\n";
			str += exporter.parse(lightBuckets[i].geometry, "Material" + j, faceIndexOffset) + "\n";

			diffuse.setHex(lightBuckets[i].lightColor);

			mtl += "newmtl Material" + j + "\n";
			mtl += "Ns " + specularHardness.toFixed(6) + "\n";
			mtl += "Ka " + colorToString(ambient) + "\n";
			mtl += "Kd " + colorToString(diffuse) + "\n";
			mtl += "Ks " + colorToString(specular) + "\n";
			mtl += "Ke " + getEmissiveColor(lightBuckets[i].lightLevel).toFixed(6) + "\n";
			mtl += "Ni " + refractionIndex.toFixed(6) + "\n";
			mtl += "d " + transparency.toFixed(6) + "\n";
			mtl += "illum " + illum + "\n\n";

			j++;
			faceIndexOffset += lightBuckets[i].geometry.vertices.length;
		}

		var zip = new JSZip();
		zip.file("map.obj", str);
		zip.file("map.mtl", mtl);
		zip.file("map_base.obj", this.getSingleObjectMapOBJ());
		var content = zip.generate();
		location.href = "data:application/zip;base64," + content;
	},
};