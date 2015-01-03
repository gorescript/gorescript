GS.VoxelMeshingHelper = {
	faces: {
		posX: 0,
		negX: 1,
		posY: 2,
		negY: 3,
		posZ: 4,
		negZ: 5,
	},

	cellSides: {
		Left: 0x01,
		Right: 0x02,
		Up: 0x04,
		Down: 0x08,
	},

	voxelCoordsWithinBounds: function(x, y, z, size) {
		return (x >= 0 && x < size &&
				y >= 0 && y < size &&
				z >= 0 && z < size);
	},

	addGeometryForFace: function() {
		var vertices = GS.Cube.getVertices();

		return function(geometry, face, voxelMesh, voxel, size) {
			var n = geometry.vertices.length;

			for (i = face * 6; i < (face + 1) * 6; i++) {
				var v = vertices[i];
				var x = (v.x + 1) / 2 - size / 2;
				var y = (v.y + 1) / 2 - size / 2;
				var z = (v.z + 1) / 2 - size / 2;
				geometry.vertices.push(new THREE.Vector3(x, y, z).add(voxel.pos));
			}

			geometry.faces.push(new THREE.Face3(n, n + 1, n + 2));
			geometry.faces.push(new THREE.Face3(n + 3, n + 4, n + 5));

			var sides = this.getSidesForFace(face, voxelMesh, voxel, size);
			var r = this.getUVsForMaterial(voxel.material, sides);

			geometry.faceVertexUvs[0].push([
				new THREE.Vector2(r.x0, r.y0),
				new THREE.Vector2(r.x1, r.y0),
				new THREE.Vector2(r.x0, r.y1),
			]);
			geometry.faceVertexUvs[0].push([
				new THREE.Vector2(r.x1, r.y0),
				new THREE.Vector2(r.x1, r.y1),
				new THREE.Vector2(r.x0, r.y1),
			]);			
		};
	}(),

	getSidesForFace: function(face, voxelMesh, voxel, size) {
		var p = voxel.pos;
		var that = this;

		var voxelExists = function(x, y, z, face) {
			if (that.voxelCoordsWithinBounds(x, y, z, size)) {
				v = voxelMesh[that.padXYZ(x, y, z)];
				if (v !== undefined && v.material == voxel.material && v.visibleFaces !== undefined && v.visibleFaces[face]) {
					return true;
				}
			}
			return false;
		};

		var sides = 0;
		if (face == this.faces.posY) {
			if (!voxelExists(p.x + 1, p.y, p.z, this.faces.posY)) { sides |= this.cellSides.Right; }
			if (!voxelExists(p.x - 1, p.y, p.z, this.faces.posY)) { sides |= this.cellSides.Left; }
			if (!voxelExists(p.x, p.y, p.z + 1, this.faces.posY)) { sides |= this.cellSides.Up; }
			if (!voxelExists(p.x, p.y, p.z - 1, this.faces.posY)) { sides |= this.cellSides.Down; }
		} else
		if (face == this.faces.negY) {
			if (!voxelExists(p.x + 1, p.y, p.z, this.faces.negY)) { sides |= this.cellSides.Right; }
			if (!voxelExists(p.x - 1, p.y, p.z, this.faces.negY)) { sides |= this.cellSides.Left; }
			if (!voxelExists(p.x, p.y, p.z - 1, this.faces.negY)) { sides |= this.cellSides.Up; }
			if (!voxelExists(p.x, p.y, p.z + 1, this.faces.negY)) { sides |= this.cellSides.Down; }
		} else
		if (face == this.faces.posX) {
			if (!voxelExists(p.x, p.y, p.z + 1, this.faces.posX)) { sides |= this.cellSides.Right; }
			if (!voxelExists(p.x, p.y, p.z - 1, this.faces.posX)) { sides |= this.cellSides.Left; }
			if (!voxelExists(p.x, p.y + 1, p.z, this.faces.posX)) { sides |= this.cellSides.Up; }
			if (!voxelExists(p.x, p.y - 1, p.z, this.faces.posX)) { sides |= this.cellSides.Down; }
		} else
		if (face == this.faces.negX) {
			if (!voxelExists(p.x, p.y, p.z - 1, this.faces.negX)) { sides |= this.cellSides.Right; }
			if (!voxelExists(p.x, p.y, p.z + 1, this.faces.negX)) { sides |= this.cellSides.Left; }
			if (!voxelExists(p.x, p.y + 1, p.z, this.faces.negX)) { sides |= this.cellSides.Up; }
			if (!voxelExists(p.x, p.y - 1, p.z, this.faces.negX)) { sides |= this.cellSides.Down; }
		} else
		if (face == this.faces.posZ) {
			if (!voxelExists(p.x - 1, p.y, p.z, this.faces.posZ)) { sides |= this.cellSides.Right; }
			if (!voxelExists(p.x + 1, p.y, p.z, this.faces.posZ)) { sides |= this.cellSides.Left; }
			if (!voxelExists(p.x, p.y + 1, p.z, this.faces.posZ)) { sides |= this.cellSides.Up; }
			if (!voxelExists(p.x, p.y - 1, p.z, this.faces.posZ)) { sides |= this.cellSides.Down; }
		} else
		if (face == this.faces.negZ) {
			if (!voxelExists(p.x + 1, p.y, p.z, this.faces.negZ)) { sides |= this.cellSides.Right; }
			if (!voxelExists(p.x - 1, p.y, p.z, this.faces.negZ)) { sides |= this.cellSides.Left; }
			if (!voxelExists(p.x, p.y + 1, p.z, this.faces.negZ)) { sides |= this.cellSides.Up; }
			if (!voxelExists(p.x, p.y - 1, p.z, this.faces.negZ)) { sides |= this.cellSides.Down; }
		}

		return sides;
	},

	getUVsForMaterial: function(material, sides) {
		var i = material;
		var x = (i % this.textureColumnCount) * this.textureCellSize;
		var y = 1 - Math.floor(i / this.textureColumnCount) * this.textureCellSize;

		var edge = 0.01;
		var x0 = x + (sides % 4) * this.textureSideCellSize + edge;
		var y0 = y - Math.floor(sides / 4) * this.textureSideCellSize - edge;
		var x1 = x0 + this.textureSideCellSize - edge * 2;
		var y1 = y0 - this.textureSideCellSize + edge * 2;

		return {
			x0: x0,
			y0: y0,
			x1: x1,
			y1: y1,
		};
	},

	addVisibleFaces: function(voxelMesh, size, voxel) {
		var that = this;
		var result = {};
		var p = voxel.pos;

		voxel.visibleFaces = {};

		var addFaceIfVisible = function(x, y, z, propertyName) {
			if (that.voxelCoordsWithinBounds(x, y, z, size)) {
				var v = voxelMesh[that.padXYZ(x, y, z)];
				if (v === undefined) {
					voxel.visibleFaces[propertyName] = true;
				}
			} else {
				voxel.visibleFaces[propertyName] = true;
			}
		};

		addFaceIfVisible(p.x, p.y, p.z - 1, this.faces.negZ);
		addFaceIfVisible(p.x, p.y, p.z + 1, this.faces.posZ);
		addFaceIfVisible(p.x, p.y - 1, p.z, this.faces.negY);
		addFaceIfVisible(p.x, p.y + 1, p.z, this.faces.posY);
		addFaceIfVisible(p.x - 1, p.y, p.z, this.faces.negX);
		addFaceIfVisible(p.x + 1, p.y, p.z, this.faces.posX);
	},

	drawTextureCell: function(ctx, x, y, flags, cellSize, color, backgroundColor) {
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(x, y, cellSize, cellSize);
		ctx.fillStyle = color;

		if (flags & this.cellSides.Left) {
			ctx.fillRect(x, y, cellSize * 0.25, cellSize);
		}
		if (flags & this.cellSides.Right) {
			ctx.fillRect(x + cellSize * 0.75, y, cellSize * 0.25, cellSize);
		}
		if (flags & this.cellSides.Up) {
			ctx.fillRect(x, y, cellSize, cellSize * 0.25);
		}
		if (flags & this.cellSides.Down) {
			ctx.fillRect(x, y + cellSize * 0.75, cellSize, cellSize * 0.25);
		}
	},

	vec4FromHex: function(hex) {
		return new THREE.Vector4((hex >> 16) & 255,	(hex >> 8) & 255, hex & 255, 1);
	},

	vec4ToRGBAString: function(rgba) {
		return "rgba(" + rgba.x + ", " + rgba.y + ", " + rgba.z + ", " + rgba.w + ")";
	},

	vec4ClampRGBA: function(rgba) {
		rgba.x = GS.MathHelper.clamp(rgba.x, 0, 255);
		rgba.y = GS.MathHelper.clamp(rgba.y, 0, 255);
		rgba.z = GS.MathHelper.clamp(rgba.z, 0, 255);
		rgba.w = GS.MathHelper.clamp(rgba.w, 0, 1);
	},

	vec4Floor: function(v) {
		v.x = Math.floor(v.x);
		v.y = Math.floor(v.y);
		v.z = Math.floor(v.z);
		v.w = Math.floor(v.w);
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

	getTexture: function(colors, edgeColors) {
		var that = this;

		function colorFunc(j) {
			var rgba = that.vec4FromHex(colors[j]);
			var rgbaEdge = that.vec4FromHex(edgeColors[j]);

			return { 
				color: that.vec4ToRGBAString(rgba),
				colorEdge: that.vec4ToRGBAString(rgbaEdge),
			};
		}

		return this._getTexture(colors.length, colorFunc);
	},

	getGlowTexture: function(glows) {
		var that = this;

		function colorFunc(j) {
			return { 
				color: glows.center[j] ? "#fff" : "#000",
				colorEdge: glows.edge[j] ? "#fff" : "#000",
			};
		}

		return this._getTexture(glows.center.length, colorFunc);
	},

	_getTexture: function(numColors, colorFunc) {
		var cellSize = 64;
		var sideCellSize = cellSize * 0.25;
		var columnCount = 4;
		var rowCount = Math.ceil(numColors / columnCount);
		var width = cellSize * columnCount;		
		var height = cellSize * columnCount;

		this.textureColumnCount = columnCount;
		this.textureCellSize = 1 / columnCount;
		this.textureSideCellSize = this.textureCellSize * 0.25;

		var canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		canvas.style.backgroundColor = "rgba(255, 255, 255, 1)";

		var ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		ctx.save();

		for (var j = 0; j < numColors; j++) {
			var x0 = (j % columnCount) * cellSize;
			var y0 = Math.floor(j / columnCount) * cellSize;

			var result = colorFunc(j);
			for (var i = 0; i < 16; i++) {
				var x = x0 + (i % 4) * sideCellSize;
				var y = y0 + Math.floor(i / 4) * sideCellSize;

				this.drawTextureCell(ctx, x, y, i, sideCellSize, result.colorEdge, result.color);
			}
		}

		var tex = new THREE.Texture(canvas);
		tex.needsUpdate = true;
		return { canvas: canvas, texture: tex };
	},

	voxelMeshToTriangleMeshGreedy: function(voxelMesh, size, material) {
		var that = this;

		var dims = [size, size, size];
		var voxels = new Int32Array(dims[0] * dims[1] * dims[2]);

		var n = 0;
		for (var k = 0; k < size; ++k) {
			for (var j = 0; j < size; ++j) {
				for (var i = 0; i < size; ++i, ++n) {
					var voxel = voxelMesh[that.padXYZ(i, j, k)];
					var color = 0;

					if (voxel !== undefined) {
						color = voxel.material + 1;
					}

					voxels[n] = color;
				}
			}
		}

		var geometry = new THREE.Geometry();

		var result = GS.GreedyMeshingHelper.voxelsToMesh(voxels, dims);
		this.fixTJunctions(result, geometry.vertices, size);

		for (var i = 0; i < result.faces.length; ++i) {
			var q = result.faces[i];

			var k = q[4] - 1;
			var edge = 0.05;
			var x0 = (k % this.textureColumnCount) * this.textureCellSize + edge;
			var y0 = 1 - Math.floor(k / this.textureColumnCount) * this.textureCellSize - edge;
			var x1 = x0 + this.textureCellSize - edge * 2;
			var y1 = y0 - this.textureCellSize + edge * 2;
			
			geometry.faces.push(new THREE.Face3(q[2], q[3], q[1]));
			geometry.faces.push(new THREE.Face3(q[3], q[0], q[1]));

			geometry.faceVertexUvs[0].push([
				new THREE.Vector2(x0, y0),
				new THREE.Vector2(x1, y0),
				new THREE.Vector2(x0, y1),
			]);
			geometry.faceVertexUvs[0].push([
				new THREE.Vector2(x1, y0),
				new THREE.Vector2(x1, y1),
				new THREE.Vector2(x0, y1),
			]);
		}
      
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		var mesh = new THREE.Mesh(geometry, material);
		return mesh;
	},

	fixTJunctions: function(result, vertices, size) {
		var epsilon = 0.001;

		var v = result.vertices;
		var idx = result.faces;

		var center = new THREE.Vector3();

		var v0 = new THREE.Vector3();
		var v1 = new THREE.Vector3();
		var v2 = new THREE.Vector3();
		var v3 = new THREE.Vector3();

		var aux = new THREE.Vector3();
		var a;

		for (var i = 0; i < idx.length; i++) {
			a = v[idx[i][0]];
			v0.set(a[0] - size / 2, a[1] - size / 2, a[2] - size / 2);

			a = v[idx[i][1]];
			v1.set(a[0] - size / 2, a[1] - size / 2, a[2] - size / 2);

			a = v[idx[i][2]];
			v2.set(a[0] - size / 2, a[1] - size / 2, a[2] - size / 2);

			a = v[idx[i][3]];
			v3.set(a[0] - size / 2, a[1] - size / 2, a[2] - size / 2);

			center.copy(v0);
			center.add(v1);
			center.add(v2);
			center.add(v3);
			center.divideScalar(4);

			aux.copy(v0).sub(center).normalize().multiplyScalar(epsilon);
			v0.add(aux);

			aux.copy(v1).sub(center).normalize().multiplyScalar(epsilon);
			v1.add(aux);

			aux.copy(v2).sub(center).normalize().multiplyScalar(epsilon);
			v2.add(aux);

			aux.copy(v3).sub(center).normalize().multiplyScalar(epsilon);
			v3.add(aux);

			vertices.push(v0.clone());
			vertices.push(v1.clone());
			vertices.push(v2.clone());
			vertices.push(v3.clone());
		}
	},

	voxelMeshToTriangleMesh: function(voxelMesh, size, material) {
		var that = this;

		var geometry = new THREE.Geometry();
		Object.keys(voxelMesh).forEach(function(key) {
			var voxel = voxelMesh[key];
			that.addVisibleFaces(voxelMesh, size, voxel);
		});

		Object.keys(voxelMesh).forEach(function(key) {
			var voxel = voxelMesh[key];
			Object.keys(voxel.visibleFaces).forEach(function(key) {
				that.addGeometryForFace(geometry, parseInt(key), voxelMesh, voxel, size);
			});
		});

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		var mesh = new THREE.Mesh(geometry, material);
		return mesh;
	},
};