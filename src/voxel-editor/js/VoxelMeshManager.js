GS.VoxelMeshManager = function(canvasInfo, renderer, scene, camera) {	
	this.canvasInfo = canvasInfo;
	this.renderer = renderer;
	this.scene = scene;
	this.camera = camera;

	this.maxAnisotropy = this.renderer.getMaxAnisotropy();
    this.body = document.getElementById("body");
    
	this.size = 32;
	this.voxelMesh = {};
	this.name = this.generateName();
	this.box3 = new THREE.Box3(new THREE.Vector3(-this.size / 2, -this.size / 2, -this.size / 2), 
		new THREE.Vector3(this.size / 2, this.size / 2, this.size / 2));

	this.tex = THREE.ImageUtils.loadTexture("img/white.jpg");
	this.tex.anisotropy = this.canvasInfo.maxAnisotropy;

	this.mousePressed = false;
	this.timeOfLastMousePress = new Date();
	this.minTimeBetweenMousePresses = 250;

	this.selectedMaterial = 0;
	this.texture = null;
	this.meltFloorHeight = 0;

	this.onCountChange = function(e) {};
};

GS.VoxelMeshManager.prototype = {
	init: function() {
		this.mesh = new THREE.Object3D();
		this.scene.add(this.mesh);

		this.initMaterials();
		this.addCenterVoxels();
		//this.addRandomVoxels();

		this.cursorMesh = this.getCursorMesh();
		this.scene.add(this.cursorMesh);

		this.projector = new THREE.Projector();

		this.updateTexture();
		this.updateMesh();

		//this.viewGeneratedTexture();
	},

	generateName: function() {
		return "random_" + Math.floor(Math.random() * 256);
	},

	updateTexture: function() {
		var result = GS.VoxelMeshingHelper.getTexture(this.colors, this.edgeColors);
		this.texture = result.texture;
		this.texture.anisotropy = this.maxAnisotropy;
		this.textureCanvas = result.canvas;
		this.material = new THREE.MeshBasicMaterial({ map: this.texture });

		if (this.mesh.children.length > 0) {
			this.mesh.children[0].material = this.material;
		}
	},

	viewGeneratedTexture: function() {
		//var result = GS.VoxelMeshingHelper.getTexture(this.colors);
		var vmh = GS.VoxelMeshingHelper;
		var sides = vmh.cellSides.Up | vmh.cellSides.Left | vmh.cellSides.Right;
		var r = GS.VoxelMeshingHelper.getUVsForMaterial(5, sides);
		this.drawCoords(this.textureCanvas, r);
		this.textureCanvas.style.width = "768px";
		this.textureCanvas.style.height = "768px";
		$("#canvas-container").empty().append(this.textureCanvas);
	},

	drawCoords: function(canvas, r) {
		var ctx = canvas.getContext("2d");
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(r.x0 * 1024, 1024 - r.y0 * 1024);
		ctx.lineTo(r.x1 * 1024, 1024 - r.y0 * 1024);
		ctx.lineTo(r.x1 * 1024, 1024 - r.y1 * 1024);
		ctx.lineTo(r.x0 * 1024, 1024 - r.y1 * 1024);
		ctx.closePath();
		ctx.stroke();
	},

	initMaterials: function() {
		this.colors = [
			0x808080, 0xffffff,	0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff, 0xff00ff,
			0x673E28, 0xCB7424, 0x331A1D, 0xFFD092, 0x5E6355, 0x999960, 0x344B7F, 0x767D8D
		];
		this.edgeColors = [
			0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
			0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
		];

		this.transMatRed = new THREE.MeshBasicMaterial({ map: this.tex, color: 0xff0000, opacity: 0.5, transparent: true });
		this.transMatGreen = new THREE.MeshBasicMaterial({ map: this.tex, color: 0x00ff00, opacity: 0.5, transparent: true });

		this.initGlows();
	},

	initGlows: function() {
		this.glows = {
			center: [],
			edge: [],
		};

		for (var i = 0; i < this.colors.length; i++) {
			this.glows.center.push(false);
			this.glows.edge.push(false);
		}
	},

	addRandomVoxels: function() {
		for (var i = 0; i < 500; i++) {
			var x = Math.floor(Math.random() * this.size);
			var y = Math.floor(Math.random() * this.size);
			var z = Math.floor(Math.random() * this.size);
			var m = Math.floor(Math.random() * this.colors.length);
			this.addVoxel(x, y, z, m, true);
		}
		this.updateMesh();
	},

	addCube: function() {
		var size = Math.floor(this.size * 0.5);
		var min = new THREE.Vector3((this.size - size) / 2, (this.size - size) / 2, (this.size - size) / 2);
		var max = new THREE.Vector3((this.size - size) / 2 + size, (this.size - size) / 2 + size, (this.size - size) / 2 + size);

		for (var x = min.x; x < max.x; x++) {
			for (var y = min.y; y < max.y; y++) {
				for (var z = min.z; z < max.z; z++) {
					this.addVoxel(x, y, z, this.selectedMaterial, true);
				}
			}
		}

		this.updateMesh();
		this.onCountChange({ count: Object.keys(this.voxelMesh).length });		
	},

	addSphere: function() {
		var size = Math.floor(this.size * 0.5);
		var min = new THREE.Vector3((this.size - size) / 2, (this.size - size) / 2, (this.size - size) / 2);
		var max = new THREE.Vector3((this.size - size) / 2 + size, (this.size - size) / 2 + size, (this.size - size) / 2 + size);

		for (var x = min.x; x < max.x; x++) {
			for (var y = min.y; y < max.y; y++) {
				for (var z = min.z; z < max.z; z++) {
					var x0 = x - 16;
					var y0 = y - 16;
					var z0 = z - 16;

					if (x0 * x0 + y0 * y0 + z0 * z0 < 8 * 8) {
						this.addVoxel(x, y, z, this.selectedMaterial, true);
					}
				}
			}
		}

		this.updateMesh();
		this.onCountChange({ count: Object.keys(this.voxelMesh).length });		
	},

	flipHorizontally: function() {
		var that = this;
		var flippedMesh = {};

		var halfSize = new THREE.Vector3(0.5, 0.5, 0.5);

		Object.keys(this.voxelMesh).forEach(function(key) {
			var voxel = that.voxelMesh[key];
			var p = that.getXYZ(key);
			var pHex = that.padXYZ(p.x, p.y, p.z);
			var mpHex = that.padXYZ(that.size - p.x - 1, p.y, p.z);

			flippedMesh[mpHex] = voxel;
			voxel.pos.x = that.size - voxel.pos.x - 1;
			voxel.box3.set(voxel.pos.clone().sub(halfSize), voxel.pos.clone().add(halfSize));
		});

		this.voxelMesh = flippedMesh;
		this.updateMesh();
	},

	flipVertically: function() {
		var that = this;
		var flippedMesh = {};

		var halfSize = new THREE.Vector3(0.5, 0.5, 0.5);

		Object.keys(this.voxelMesh).forEach(function(key) {
			var voxel = that.voxelMesh[key];
			var p = that.getXYZ(key);
			var pHex = that.padXYZ(p.x, p.y, p.z);
			var mpHex = that.padXYZ(p.x, that.size - p.y - 1, p.z);

			flippedMesh[mpHex] = voxel;
			voxel.pos.y = that.size - voxel.pos.y - 1;
			voxel.box3.set(voxel.pos.clone().sub(halfSize), voxel.pos.clone().add(halfSize));
		});

		this.voxelMesh = flippedMesh;
		this.updateMesh();
	},

	melt: function(floorHeight) {
		floorHeight = floorHeight || 0;

		var that = this;
		var resultMesh = {};
		var halfSize = new THREE.Vector3(0.5, 0.5, 0.5);

		for (var i = floorHeight; i < this.size; i++) {
			Object.keys(this.voxelMesh).forEach(meltMesh);
		}

		this.voxelMesh = resultMesh;
		this.updateMesh();

		function meltMesh(key) {
			var voxel = that.voxelMesh[key];
			var p = that.getXYZ(key);
			if (p.y === i) {
				var newY = i - 1;
				if (newY < floorHeight) {
					newY = floorHeight;
				}
				var pHex = that.padXYZ(p.x, p.y, p.z);
				var newHex = that.padXYZ(p.x, newY, p.z);

				if (resultMesh[newHex] === undefined || Math.random() >= 0.5) {
					resultMesh[newHex] = voxel;
					voxel.pos.y = newY;
					voxel.box3.set(voxel.pos.clone().sub(halfSize), voxel.pos.clone().add(halfSize));
				} else {
					resultMesh[pHex] = voxel;
				}
			}
		}
	},

	addMeshToScene: function() {
		var that = this;
		Object.keys(this.voxelMesh).forEach(function(key) {
			var p = that.getXYZ(key);
			that.addVoxel(p.x, p.y, p.z, that.voxelMesh[key]);
		});
	},

	getCursorMesh: function() {
		var geometry = new THREE.BoxGeometry(1, 1, 1);
		var material = this.transMatGreen;
		var mesh = new THREE.Mesh(geometry, material);
		return mesh;
	},

	getVoxelCount: function() {
		return Object.keys(this.voxelMesh).length;
	},

	voxelCoordsWithinBounds: function(x, y, z) {
		return (x >= 0 && x < this.size &&
				y >= 0 && y < this.size &&
				z >= 0 && z < this.size);
	},

	addVoxel: function(x, y, z, m, noUpdate) {
		if (noUpdate || this.voxelCoordsWithinBounds(x, y, z)) {
			var n = this.size;
			var pos = new THREE.Vector3(x + 0.5 - n / 2, y + 0.5 - n / 2, z + 0.5 - n / 2);

			var halfSize = new THREE.Vector3(0.5, 0.5, 0.5);
			var voxel = {
				pos: new THREE.Vector3(x, y, z),
				material: m,
				box3: new THREE.Box3(new THREE.Vector3().subVectors(pos, halfSize),
					new THREE.Vector3().addVectors(pos, halfSize)),
			};

			this.voxelMesh[this.padXYZ(x, y, z)] = voxel;
		}
		if (!noUpdate) {
			this.updateMesh();
			this.onCountChange({ count: Object.keys(this.voxelMesh).length });
		}
	},

	removeVoxel: function(x, y, z) {
		var key = this.padXYZ(x, y, z);
		var voxel = this.voxelMesh[key];
		delete this.voxelMesh[key];
		this.updateMesh();
	},

	getVoxel: function(x, y, z) {
		return this.voxelMesh[this.padXYZ(x, y, z)];
	},

	getMeshFromBox3: function(box3) {
		var geometry = new THREE.BoxGeometry(1, 1, 1);
		var mesh = new THREE.Mesh(geometry, this.transMatGreen);
		mesh.scale.subVectors(box3.max, box3.min);
		mesh.position.subVectors(box3.max, box3.min).divideScalar(2).add(box3.min);
		return mesh;		
	},

	pad: function(n, width, z) {
		z = z || "0";
		n = n + "";
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	},

	padXYZ: function(x, y, z) {
		return this.pad(x, 2) + this.pad(y, 2) + this.pad(z, 2);
	},

	getXYZ: function(str) {
		var result = {
			x: parseInt(str.substr(0, 2), 10),
			y: parseInt(str.substr(2, 2), 10),
			z: parseInt(str.substr(4, 2), 10),
		};

		return result;
	},

	addCenterVoxels: function() {
		var n = this.size / 2;
		this.addVoxel(n - 1, n - 1, n - 1, 0, true);
		this.addVoxel(n - 0, n - 0, n - 0, 1, true);
		this.addVoxel(n - 1, n - 0, n - 0, 2, true);
		this.addVoxel(n - 1, n - 1, n - 0, 3, true);
		this.addVoxel(n - 0, n - 1, n - 1, 4, true);
		this.addVoxel(n - 0, n - 0, n - 1, 5, true);
		this.addVoxel(n - 1, n - 0, n - 1, 6, true);
		this.addVoxel(n - 0, n - 1, n - 0, 7, true);
	},

	convertToVoxelCoords: function(v) {
		v.x = Math.round(v.x) + this.size / 2;
		v.y = Math.round(v.y) + this.size / 2;
		v.z = Math.round(v.z) + this.size / 2;
	},

	convertToWorldCoords: function(v) {
		v.x = v.x - this.size / 2 + 0.5;
		v.y = v.y - this.size / 2 + 0.5;
		v.z = v.z - this.size / 2 + 0.5;
	},

	// http://xboxforums.create.msdn.com/forums/p/98616/587817.aspx#587817
	getBox3IntersectionFace: function(box3, point) {
        var distMin = point.clone().sub(box3.min);
        var distMax = point.clone().sub(box3.max);

        distMin.x = Math.abs(distMin.x);
        distMin.y = Math.abs(distMin.y);
        distMin.z = Math.abs(distMin.z);

        distMax.x = Math.abs(distMax.x);
        distMax.y = Math.abs(distMax.y);
        distMax.z = Math.abs(distMax.z);

        var face = new THREE.Vector3(-1, 0, 0);
        var minDist = distMin.x;
          
        if(distMax.x < minDist) {
            minDist = distMax.x;
            face.set(1, 0, 0);
        }
        if(distMin.y < minDist) {
            minDist = distMin.y;
            face.set(0, -1, 0);
        }
        if(distMax.y < minDist) {
            minDist = distMax.y;
            face.set(0, 1, 0);
        }
        if(distMin.z < minDist) {
            minDist = distMin.z;
            face.set(0, 0, -1);
        }
        if(distMax.z < minDist) {
            minDist = distMin.z;
            face.set(0, 0, 1);
        }

        return face;
	},

	rayIntersectsVoxels: function(ray) {
		var minPoint = new THREE.Vector3();
		var minDist = Infinity;
		var found = {};
		var keys = Object.keys(this.voxelMesh);
		for (var i = 0; i < keys.length; i++) {
			var box3 = this.voxelMesh[keys[i]].box3;
			var point = ray.intersectBox(box3);			
			if (point !== null) {
				var dist = this.camera.position.distanceToSquared(point);
				if (dist < minDist) {
					minPoint.copy(point);
					minDist = dist;
					found.voxel = this.voxelMesh[keys[i]];					
				}
			}
		}

		if (found.voxel !== undefined) {
			var face = this.getBox3IntersectionFace(found.voxel.box3, minPoint);
			found.adjacentVoxelPos = face.add(found.voxel.pos);
			return found;
		} else {
			return undefined;
		}
	},

	updateCursorMesh: function(mx, my) {
		var dir = new THREE.Vector3((mx / this.canvasInfo.width) * 2 - 1, -(my / this.canvasInfo.height) * 2 + 1, 0.5);
		this.projector.unprojectVector(dir, this.camera);
		dir.sub(this.camera.position).normalize();
		
		var ray = new THREE.Ray(this.camera.position, dir);

		this.cursorPosition = undefined;
		this.selectedVoxel = undefined;
		var result = this.rayIntersectsVoxels(ray);		
		if (result !== undefined) {
			this.selectedVoxel = result.voxel;
			var v = result.adjacentVoxelPos;

			if (this.voxelCoordsWithinBounds(v.x, v.y, v.z)) {
				this.cursorPosition = v;
			}
		}

		if (this.cursorPosition !== undefined) {
			var coords = this.cursorPosition.clone();
			this.convertToWorldCoords(coords);
			this.cursorMesh.material = this.transMatGreen;
			this.cursorMesh.position = coords;
		} else {
			this.cursorMesh.material = this.transMatRed;
			this.cursorMesh.position = this.camera.position.clone().add(dir.clone().multiplyScalar(3));
		}
	},

	update: function() {
        console.log("Scroll: " + this.body.scrollTop);
		var mx = GS.InputHelper.mouseX - this.body.scrollLeft;
		var my = GS.InputHelper.mouseY - this.body.scrollTop;

		if (!GS.InputHelper.leftMouseDown && !GS.InputHelper.rightMouseDown) {
			this.mousePressed = false;
		}

		if (this.mousePressed && (new Date() - this.timeOfLastMousePress > this.minTimeBetweenMousePresses)) {
			this.mousePressed = false;
		}

		this.cursorMesh.visible = !GS.InputHelper.middleMouseDown;
		if (mx < this.canvasInfo.width && !GS.InputHelper.middleMouseDown) {
			this.updateCursorMesh(mx, my);

			if (!this.mousePressed && GS.InputHelper.leftMouseDown) {
				if (this.cursorPosition !== undefined) {
					var v = this.cursorPosition;
					this.addVoxel(v.x, v.y, v.z, this.selectedMaterial);
				}
				this.mousePressed = true;
				this.timeOfLastMousePress = new Date();
			}

			if (!this.mousePressed && GS.InputHelper.rightMouseDown) {
				if (this.selectedVoxel !== undefined) {
					var v = this.selectedVoxel.pos;
					this.removeVoxel(v.x, v.y, v.z);
				}
				this.mousePressed = true;
				this.timeOfLastMousePress = new Date();
			}
		}
	},

	clear: function() {
		this.mesh.remove(this.mesh.children[0]);
	},

	updateMesh: function() {
		this.clear();
		this.mesh.add(GS.VoxelMeshingHelper.voxelMeshToTriangleMesh(this.voxelMesh, this.size, this.material));
	},

	updateMeshForExport: function() {
		for (var i = 0; i < this.colors.length; i++) {
			this.edgeColors[i] = this.colors[i];
		}

		this.updateTexture();

		this.clear();
		this.mesh.add(GS.VoxelMeshingHelper.voxelMeshToTriangleMeshGreedy(this.voxelMesh, this.size, this.material));
	},

	importVoxelMesh: function(jsonStr) {
		var that = this;
		this.clear();
		this.voxelMesh = {};

		var result = JSON.parse(jsonStr, function(k, v) {
			return v;
		});

		this.name = result.name;
		delete result.name;

		if (this.name === undefined) {
			this.name = this.generateName();			
		}

		if (result.colors !== undefined) {
			this.colors = result.colors;
			this.edgeColors = result.edgeColors;

			if (result.glows !== undefined) {
				this.glows = result.glows;
			} else {
				this.initGlows();
			}

			this.updateTexture();
			this.dispatchEvent({ type: "importDone" });
		}

		Object.keys(result).forEach(function(key) {
			var obj = result[key];

			var p = that.getXYZ(key);
			that.addVoxel(p.x, p.y, p.z, obj.material, true);
		});

		if (this.voxelMesh.NaNNaNNaN !== undefined) {
			delete this.voxelMesh.NaNNaNNaN;
		}

		this.updateMesh();
	},

	downloadAsZip: function(filename, contentStr) {
		var zip = new JSZip();
		zip.file(filename, contentStr);
		var content = zip.generate();
		location.href = "data:application/zip;base64," + content;
	},

	downloadVoxelMesh: function() {
		var stripped = {};
		$.extend(true, stripped, this.voxelMesh);
		Object.keys(stripped).forEach(function(key) {
			var obj = stripped[key];
			delete obj.pos;
			delete obj.box3;
		});
		stripped.colors = this.colors;
		stripped.edgeColors = this.edgeColors;
		stripped.glows = this.glows;
		stripped.name = this.name;

		return stripped;
	},

	exportToOBJ: function(js) {
		this.updateMeshForExport();

		var exporter = new THREE.OBJExporter();
		str = exporter.parse(this.mesh.children[0].geometry);

		var canvasData = this.textureCanvas.toDataURL("image/png");
		canvasData = canvasData.substr(canvasData.indexOf(",") + 1);

		var glowCanvas = GS.VoxelMeshingHelper.getGlowTexture(this.glows).canvas;
		var glowCanvasData = glowCanvas.toDataURL("image/png");
		glowCanvasData = glowCanvasData.substr(glowCanvasData.indexOf(",") + 1);

		var zip = new JSZip();
		var filename = this.name + "." + (js ? "js" : "obj");
		zip.file(filename, str);
		zip.file(this.name + ".png", canvasData, { base64: true });
		zip.file(this.name + "_glow.png", glowCanvasData, { base64: true });
		var content = zip.generate();
		location.href = "data:application/zip;base64," + content;
	},

	exportToServer: function() {
		this.updateMeshForExport();

		var exporter = new THREE.OBJExporter();
		str = exporter.parse(this.mesh.children[0].geometry);

		return { name: this.name, obj: str };
	},
};

THREE.EventDispatcher.prototype.apply(GS.VoxelMeshManager.prototype);