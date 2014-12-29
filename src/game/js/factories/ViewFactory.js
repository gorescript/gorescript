GS.ViewFactory = function(renderer, map, assets) {
	this.renderer = renderer;
	this.map = map;

	this.textures = assets[GS.AssetTypes.Texture];
	this.cubeTextures = assets[GS.AssetTypes.CubeTexture];
	this.meshes = assets[GS.AssetTypes.Mesh];

	this.anisotropy = renderer.getMaxAnisotropy();
	this.debugBoundingBoxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
	this.debugTriangleMaterial = new THREE.MeshBasicMaterial({ color: 0x00c0ff, wireframe: true });

	this.texScale = 16;
	this.triangleCount = 0;
};

GS.ViewFactory.prototype = {
	constructor: GS.ViewFactory,

	init: function() {
		var that = this;
		Object.keys(this.textures).forEach(function(key) {
			that.textures[key].anisotropy = that.anisotropy;
		});

		this.materials = {};

		var textureAssets = GS.Assets[GS.AssetTypes.Texture];
		for (var i in textureAssets) {
			var tex = textureAssets[i];
			if (tex.type === GS.TextureTypes.Map) {
				this.wrap(this.textures[i]);
				this.materials[i] = new THREE.MeshPhongMaterial({ map: this.textures[i] });
			} else
			if (tex.type === GS.TextureTypes.TVScreen) {
				this.textures[i].flipY = false;
			}
		}

		var entities = this.map.layerObjects[GS.MapLayers.Entity];
		var entityMaterials = {};
		for (var i = 0; i < entities.length; i++) {
			var ntt = entities[i];

			var desc = GS.MapEntities[ntt.type];
			var name = desc.name;
			if (entityMaterials[name] === undefined) {
				entityMaterials[name] = true;

				this.materials[name] = new GS.MeshPhongGlowMaterial(this.textures[name], this.textures[name + "_glow"]);
			}
		}

		for (var i in GS.Weapons) {
			this.wrap(this.textures[i]);
			this.materials[i] = new GS.MeshPhongGlowMaterial(this.textures[i], this.textures[i + "_glow"]);
		}
	},

	getSkyboxMesh: function() {
		var name = "skybox1";
		
		var tex = this.cubeTextures[name];
		tex.format = THREE.RGBFormat;

		var shader = THREE.ShaderLib["cube"];
		var uniforms = THREE.UniformsUtils.clone(shader.uniforms);
		uniforms["tCube"].value = tex;

		var material = new THREE.ShaderMaterial({
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: uniforms,
			depthWrite: false,
			side: THREE.BackSide,
		});

		var geometry = new THREE.BoxGeometry(1000, 1000, 1000);
		var mesh = new THREE.Mesh(geometry, material);

		return mesh;
	},

	wrap: function(tex) {
		tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	},

	applySegmentView: function(gridObject) {
		var seg = gridObject.sourceObj;

		var geometry = new THREE.Geometry();
		var triangles = this.getSegmentDefinedTriangles(seg);
		GS.pushArray(geometry.vertices, triangles);

		var distance = seg.start.distanceTo(seg.end);
		var length;
		if (distance > this.texScale) {
			length = Math.round((distance / (this.texScale * this.texScale)) * this.texScale);
		} else {
			length = distance / this.texScale;
		}

		var color = this.getSegmentColor(seg, gridObject.sector);

		for (var i = 0; i < triangles.length; i += 3) {
			geometry.faces.push(new THREE.Face3(
				i, i + 1, i + 2,
				null, // normal
				color
			));
		}

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		gridObject.region.mesh.geometry.merge(geometry);
	
		gridObject.view.collisionData.triangles = this.getSegmentTriangles(seg);
		this.applyConcreteBoundingBox(gridObject, triangles);

		this.triangleCount += gridObject.view.collisionData.triangles.length / 3;
	},

	getSegmentColor: function(seg, sector) {
		var color = new THREE.Color(seg.lightColor);
		this.processLightColor(color, sector.lightLevel);
		return color;
	},

	getSectorColor: function(sector) {
		var color = new THREE.Color(sector.lightColor);
		this.processLightColor(color, sector.lightLevel);
		return color;
	},

	processLightColor: function(color, lightLevel) {
		var lightLevelFactor = 0.15;
		var minLightLevel = 0.25;
		var maxLightLevel = 1.25;

		var x = lightLevel * lightLevelFactor;
		x *= x;
		x = GS.MathHelper.clamp(x, minLightLevel, maxLightLevel);
		color.multiplyScalar(x);
	},

	applySectorView: function(gridObject, ceiling) {
		var sector = gridObject.sourceObj;

		var triangles = [];

		var geometry;

		if (!ceiling) {
			if (sector.elevator !== true) {
				geometry = this.getSectorGeometry(sector, triangles, false);
				gridObject.region.mesh.geometry.merge(geometry);
			}
		} else {
			var hasCeiling = (sector.ceiling !== undefined) ? sector.ceiling : true;
			if (hasCeiling) {
				geometry = this.getSectorGeometry(sector, triangles, true);
				gridObject.region.mesh.geometry.merge(geometry);
			}
		}

		gridObject.view.collisionData.triangles = triangles;
		this.applyConcreteBoundingBox(gridObject, triangles);

		this.triangleCount += triangles.length / 3;
	},

	applyConcreteBoundingBox: function(gridObject, triangles) {
		var boundingBox = new THREE.Box3().setFromPoints(triangles);
		var center = boundingBox.min.clone().add(boundingBox.max).divideScalar(2);
		var debugMesh = this.getDebugMesh(center);
		debugMesh.scale.copy(boundingBox.max).sub(boundingBox.min).addScalar(0.01);
		gridObject.view.collisionData.boundingBox = boundingBox;
		gridObject.view.debugMesh = debugMesh;
	},

	getSectorGeometry: function(sector, sectorTriangles, ceiling) {
		var geometry = new THREE.Geometry();
		var triangles = this.getSectorTriangles(sector, ceiling);
		GS.pushArray(geometry.vertices, triangles);
		GS.pushArray(sectorTriangles, this.getSectorTriangles(sector, ceiling, true));

		var color = this.getSectorColor(sector);

		for (var j = 0; j < triangles.length; j += 3) {
			geometry.faces.push(new THREE.Face3(
				j, j + 1, j + 2, 
				null, // normal
				color
			));
		}

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		return geometry;
	},

	getSegmentDefinedTriangles: function(seg) {
		var triangles = [];

		var bottomRightIndex = 0;
		for (var i = 0; i < seg.indices.length; i += 3) {
			triangles.push(seg.vertices[seg.indices[i]]);
			triangles.push(seg.vertices[seg.indices[i + 1]]);
			triangles.push(seg.vertices[seg.indices[i + 2]]);

			if (seg.indices[i + 2] == seg.bottomRightIndex) {
				bottomRightIndex = i + 3;
			}
		}
		seg.bottomRightIndex = bottomRightIndex;

		return triangles;
	},

	getSegmentTriangles: function(seg) {
		var triangles = [];

		triangles.push(new THREE.Vector3(seg.start.x, seg.topY, seg.start.y));
		triangles.push(new THREE.Vector3(seg.end.x, seg.topY, seg.end.y));
		triangles.push(new THREE.Vector3(seg.start.x, seg.bottomY, seg.start.y));
		triangles.push(new THREE.Vector3(seg.end.x, seg.topY, seg.end.y));
		triangles.push(new THREE.Vector3(seg.end.x, seg.bottomY, seg.end.y));
		triangles.push(new THREE.Vector3(seg.start.x, seg.bottomY, seg.start.y));

		return triangles;
	},

	getSectorTriangles: function(sector, ceiling, getCollisionTriangles) {
		var triangles = [];

		var v = sector.vertices;
		var idx = sector.indices;

		if (getCollisionTriangles) {
			v = sector.collisionVertices;
			idx = sector.collisionIndices;
		}

		if (!ceiling) {
			for (var i = 0; i < idx.length; i += 3) {
				triangles.push(new THREE.Vector3(v[idx[i + 2]].x, sector.floorTopY, v[idx[i + 2]].y));
				triangles.push(new THREE.Vector3(v[idx[i + 1]].x, sector.floorTopY, v[idx[i + 1]].y));
				triangles.push(new THREE.Vector3(v[idx[i]].x, sector.floorTopY, v[idx[i]].y));
			}
		} else {
			for (var i = 0; i < idx.length; i += 3) {
				triangles.push(new THREE.Vector3(v[idx[i]].x, sector.ceilBottomY, v[idx[i]].y));
				triangles.push(new THREE.Vector3(v[idx[i + 1]].x, sector.ceilBottomY, v[idx[i + 1]].y));
				triangles.push(new THREE.Vector3(v[idx[i + 2]].x, sector.ceilBottomY, v[idx[i + 2]].y));
			}
		}

		return triangles;
	},

	applyEntityView: function(gridObject) {
		var vertices = GS.Cube.getVertices();

		return function(gridObject) {
			var that = this;

			var ntt = gridObject.sourceObj;
			var desc = GS.MapEntities[ntt.type];
			var name = GS.MapEntities[ntt.type].name;
			
			var offset = gridObject.offset;
			var scale = gridObject.scale;
			var size = gridObject.size;

			var material = this.materials[name].clone();

			var mesh;
			if (desc.animations === undefined) {
				mesh = this.meshes[name].clone();
				mesh.material = material;				
			} else {
				mesh = new THREE.Object3D();
				var data = mesh.userData;
				data.animations = {};
				Object.keys(desc.animations).forEach(function(key) {
					var count = desc.animations[key];
					data.animations[key] = [];

					for (var i = 0; i < count; i++) {
						var animationName = name + "_" + key + i;
						var animMesh = that.meshes[animationName].clone();
						animMesh.visible = false;
						animMesh.material = material;
						data.animations[key].push(animMesh);
						mesh.add(animMesh);
					}
				});
			}

			mesh.position.copy(offset);
			mesh.position.copy(gridObject.position);
			mesh.scale.copy(scale);

			gridObject.view.mesh = mesh;
			gridObject.view.debugMesh = this.getDebugMesh(gridObject.position);

			if (gridObject instanceof GS.Monster) {
				gridObject.view.collisionData.triangles = [];
				for (var i = 0; i < vertices.length; i++) {
					var v = vertices[i].clone();
					v.multiply(size).add(gridObject.view.mesh.position);
					gridObject.view.collisionData.triangles.push(v);
				}

				gridObject.view.collisionData.boundingSquare.setFromPoints([
					gridObject.position.toVector2().sub(gridObject.size.toVector2()),
					gridObject.position.toVector2().add(gridObject.size.toVector2()),
				]);
			}
		}
	}(),

	getSegmentsForMovingSector: function(gridObject, elevator) {
		var sector = gridObject.sector;
		var segs = [];

		for (var i = 0; i < sector.collisionVertices.length - 1; i++) {
			segs.push({
				start: sector.collisionVertices[i].clone(),
				end: sector.collisionVertices[i + 1].clone(),
			});
		}
		segs.push({
			start: sector.collisionVertices[i].clone(),
			end: sector.collisionVertices[0].clone(),
		});

		if (elevator !== true) {
			for (var i = 0; i < segs.length; i++) {
				segs[i].bottomY = sector.floorTopY;
				segs[i].topY = sector.ceilBottomY;
			}
		} else {
			for (var i = 0; i < segs.length; i++) {
				segs[i].bottomY = sector.floorTopY - sector.elevatorMaxHeight;
				segs[i].topY = sector.floorTopY;
			}
		}

		return segs;
	},

	applyDoorView: function(door) {
		var triangles = [];

		door.position = this.getMovingSectorPosition(door);
		door.view.collisionData.segments = this.getSegmentsForMovingSector(door, false);
		
		var mesh = new THREE.Object3D();
		mesh.children.push(this.getMovingSectorCenterMesh(door, triangles, this.materials[door.sector.ceilTexId].clone()));
		mesh.children.push(this.getMovingSectorSideMesh(door, triangles, this.materials[door.sector.sideTexId].clone()));

		mesh.children[0].position.copy(door.position);
		mesh.children[1].position.copy(door.position);

		door.view.mesh = mesh;
		door.view.collisionData.triangles = triangles;
		door.view.debugMesh = this.getDebugMesh(door.position);
		// door.view.debugMesh = this.getDebugTriangleMesh(triangles);

		var box = door.view.collisionData.boundingBox;
		box.setFromPoints(triangles);
		door.size = box.max.clone().sub(box.min).divideScalar(2);

		this.triangleCount += triangles.length / 3;
	},

	applyElevatorView: function(elevator) {
		var triangles = [];

		elevator.position = this.getMovingSectorPosition(elevator, true);
		elevator.view.collisionData.segments = this.getSegmentsForMovingSector(elevator, true);
		
		var mesh = new THREE.Object3D();
		mesh.children.push(this.getMovingSectorCenterMesh(elevator, triangles, 
			this.materials[elevator.sector.floorTexId].clone(), true));
		mesh.children.push(this.getMovingSectorSideMesh(elevator, triangles, 
			this.materials[elevator.sector.sideTexId].clone(), true));

		mesh.children[0].position.copy(elevator.position);
		mesh.children[1].position.copy(elevator.position);

		elevator.view.mesh = mesh;
		elevator.view.collisionData.triangles = triangles;
		elevator.view.debugMesh = this.getDebugMesh(elevator.position);
		//elevator.view.debugMesh = this.getDebugTriangleMesh(triangles);

		var box = elevator.view.collisionData.boundingBox;
		box.setFromPoints(triangles);
		elevator.size = box.max.clone().sub(box.min).divideScalar(2);

		this.triangleCount += triangles.length / 3;
	},

	getMovingSectorPosition: function(movingSector, elevator) {
		var box = new THREE.Box2().setFromPoints(movingSector.sector.vertices);
		var center = box.min.clone().add(box.max).divideScalar(2);

		var pos = new THREE.Vector3(center.x, 0, center.y);

		if (elevator !== true) {
			pos.y = (movingSector.sector.floorTopY + movingSector.sector.ceilBottomY) / 2;
		} else {
			pos.y = movingSector.sector.floorTopY - movingSector.sector.elevatorMaxHeight / 2;
		}

		return pos;
	},

	getMovingSectorSideMesh: function(movingSector, movingSectorTriangles, material, elevator) {
		var bottomY, topY;
		if (elevator !== true) {
			bottomY = movingSector.sector.floorTopY;
			topY = movingSector.sector.ceilBottomY;
		} else {			
			bottomY = movingSector.sector.floorTopY - movingSector.sector.elevatorMaxHeight;
			topY = movingSector.sector.floorTopY;
		}

		var geometry = new THREE.Geometry();

		var triangles = [];

		var k = 0;
		for (var i = 0; i < movingSector.sector.vertices.length; i++) {
			var next = (i < movingSector.sector.vertices.length - 1) ? (i + 1) : 0;

			var start = movingSector.sector.vertices[i];
			var end = movingSector.sector.vertices[next];

			var distance = start.distanceTo(end);
			var length;
			if (distance > this.texScale) {
				length = Math.round((distance / (this.texScale * this.texScale)) * this.texScale);
			} else {
				length = distance / this.texScale;
			}

			var vertices = [
				new THREE.Vector3(start.x, topY, start.y),
				new THREE.Vector3(end.x, topY, end.y),
				new THREE.Vector3(start.x, bottomY, start.y),
				new THREE.Vector3(end.x, topY, end.y),
				new THREE.Vector3(end.x, bottomY, end.y),
				new THREE.Vector3(start.x, bottomY, start.y),
			];

			for (var j = 0; j < vertices.length; j++) {
				triangles.push(vertices[j].clone());
			}

			for (var j = 0; j < vertices.length; j++) {
				vertices[j].sub(movingSector.position);
			}

			GS.pushArray(geometry.vertices, vertices);

			geometry.faces.push(new THREE.Face3(k, k + 1, k + 2));
			geometry.faces.push(new THREE.Face3(k + 3, k + 4, k + 5));
			k += 6;

			geometry.faceVertexUvs[0].push([
				new THREE.Vector2(0, topY / this.texScale),
				new THREE.Vector2(length, topY / this.texScale),
				new THREE.Vector2(0, bottomY / this.texScale),
			]);
			geometry.faceVertexUvs[0].push([
				new THREE.Vector2(length, topY / this.texScale),
				new THREE.Vector2(length, bottomY / this.texScale),
				new THREE.Vector2(0, bottomY / this.texScale),
			]);
		}

		GS.pushArray(movingSectorTriangles, triangles);

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		return new THREE.Mesh(geometry, material);
	},

	getMovingSectorCenterMesh: function(movingSector, movingSectorTriangles, material, elevator) {
		var minHeight = movingSector.sector.floorTopY;

		var geometry = new THREE.Geometry();

		var v = movingSector.sector.vertices;
		var idx = movingSector.sector.indices;
		var v0, v1, v2;
		for (var i = 0; i < idx.length; i += 3) {
			if (elevator === true) {
				v0 = new THREE.Vector3(v[idx[i + 2]].x, minHeight, v[idx[i + 2]].y);
				v1 = new THREE.Vector3(v[idx[i + 1]].x, minHeight, v[idx[i + 1]].y);
				v2 = new THREE.Vector3(v[idx[i]].x, minHeight, v[idx[i]].y);
			} else {
				v0 = new THREE.Vector3(v[idx[i]].x, minHeight, v[idx[i]].y);
				v1 = new THREE.Vector3(v[idx[i + 1]].x, minHeight, v[idx[i + 1]].y);
				v2 = new THREE.Vector3(v[idx[i + 2]].x, minHeight, v[idx[i + 2]].y);
			}

			geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
			geometry.faceVertexUvs[0].push([
				new THREE.Vector2(v0.x / this.texScale, v0.z / this.texScale),
				new THREE.Vector2(v1.x / this.texScale, v1.z / this.texScale),
				new THREE.Vector2(v2.x / this.texScale, v2.z / this.texScale),
			]);

			v0.sub(movingSector.position);
			v1.sub(movingSector.position);
			v2.sub(movingSector.position);

			geometry.vertices.push(v0);
			geometry.vertices.push(v1);
			geometry.vertices.push(v2);
		}

		v = movingSector.sector.collisionVertices;
		idx = movingSector.sector.collisionIndices;
		for (var i = 0; i < idx.length; i += 3) {
			if (elevator === true) {
				v0 = new THREE.Vector3(v[idx[i + 2]].x, minHeight, v[idx[i + 2]].y);
				v1 = new THREE.Vector3(v[idx[i + 1]].x, minHeight, v[idx[i + 1]].y);
				v2 = new THREE.Vector3(v[idx[i]].x, minHeight, v[idx[i]].y);
			} else {
				v0 = new THREE.Vector3(v[idx[i]].x, minHeight, v[idx[i]].y);
				v1 = new THREE.Vector3(v[idx[i + 1]].x, minHeight, v[idx[i + 1]].y);
				v2 = new THREE.Vector3(v[idx[i + 2]].x, minHeight, v[idx[i + 2]].y);
			}

			movingSectorTriangles.push(v0);
			movingSectorTriangles.push(v1);
			movingSectorTriangles.push(v2);
		}

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		return new THREE.Mesh(geometry, material);
	},

	applyTVScreenView: function(tvScreen) {
		tvScreen.view.mesh = this.getTVScreenMesh(tvScreen);

		tvScreen.view.mesh.material = new THREE.MeshBasicMaterial({ 
			map: this.textures[tvScreen.segment.texId],
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -4,
			transparent: true,
		});
	},

	applySwitchView: function(switchObj) {
		switchObj.segment.bottomY += 8;
		switchObj.segment.topY = switchObj.segment.bottomY + 8;
		switchObj.view.mesh = this.getTVScreenMesh(switchObj);

		switchObj.view.collisionData.boundingBox.setFromPoints([
			new THREE.Vector3(switchObj.segment.start.x, switchObj.segment.bottomY, switchObj.segment.start.y),
			new THREE.Vector3(switchObj.segment.end.x, switchObj.segment.topY, switchObj.segment.end.y),
		]);

		switchObj.view.textureOn = this.textures.switch_on;
		switchObj.view.textureOff = this.textures.switch_off;

		switchObj.view.mesh.material = new THREE.MeshBasicMaterial({ 
			map: switchObj.view.textureOff,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -4,
			transparent: true,
		});
	},

	getTVScreenMesh: function(tvScreen) {
		var seg = tvScreen.segment;

		var geometry = new THREE.Geometry();
		var triangles = this.getSegmentTriangles(seg);
		GS.pushArray(geometry.vertices, triangles);

		geometry.faces.push(new THREE.Face3(0, 1, 2));
		geometry.faces.push(new THREE.Face3(3, 4, 5));

		geometry.faceVertexUvs[0].push([
			new THREE.Vector2(1, 0),
			new THREE.Vector2(0, 0),
			new THREE.Vector2(1, 1),
		]);
		geometry.faceVertexUvs[0].push([
			new THREE.Vector2(0, 0),
			new THREE.Vector2(0, 1),
			new THREE.Vector2(1, 1),
		]);

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		var mesh = new THREE.Mesh(geometry, undefined);
		mesh.matrixAutoUpdate = false;
		mesh.renderDepth = 1000;
		return mesh;
	},

	getPlayerView: function() {
		var playerView = new GS.PlayerView();
		var weapons = Object.keys(GS.Weapons);
		for (var i = 0; i < weapons.length; i++) {
			var name = weapons[i];
			if (this.meshes[name] !== undefined) {
				var material = this.materials[name].clone();				
				var mesh = this.meshes[name].clone();
				mesh.material = material;
				playerView.addWeaponMesh(name, mesh);
			}
		}
		playerView.init();

		return playerView;
	},	

	getDebugMesh: function(position) {
		var debugGeometry = new THREE.BoxGeometry(1, 1, 1);
		var debugMesh = new THREE.Mesh(debugGeometry, this.debugBoundingBoxMaterial);		
		debugMesh.position.copy(position);
		return debugMesh;
	},	

	getDebugTriangleMesh: function(triangles) {
		var debugGeometry = new THREE.Geometry();
		GS.pushArray(debugGeometry.vertices, triangles);

		for (var i = 0; i < triangles.length; i += 3) {
			debugGeometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
		}		

		var debugMesh = new THREE.Mesh(debugGeometry, this.debugTriangleMaterial);
		debugMesh.userData.isTriangleMesh = true;
		debugMesh.matrixAutoUpdate = false;
		return debugMesh;
	},
};

THREE.EventDispatcher.prototype.apply(GS.ViewFactory.prototype);