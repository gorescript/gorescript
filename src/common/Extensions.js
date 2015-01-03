(function() {

	// Vector3

	THREE.Vector3.prototype.toVector2 = function(optionalTarget) {
		var v = optionalTarget || new THREE.Vector2();
		v.x = this.x;
		v.y = this.z;
		return v;
	};

	THREE.Vector3.prototype.toString = function(d) {
		d = d || 0;
		return ["[", this.x.toFixed(d), this.y.toFixed(d), this.z.toFixed(d), "]"].join(" ");
	};

	THREE.Vector3.prototype.equalsEpsilon = function(v, e) {
		e = e || 0.0001;
		return (Math.abs(v.x - this.x) < e &&
				Math.abs(v.y - this.y) < e &&
				Math.abs(v.z - this.z) < e);
	};

	THREE.Vector3.prototype.minCoord = function() {
		return Math.min(Math.min(this.x, this.y), Math.min(this.y, this.z));
	};

	THREE.Vector3.prototype.maxCoord = function() {
		return Math.max(Math.max(this.x, this.y), Math.max(this.y, this.z));
	};
	
	// http://www.gamedev.net/page/resources/_/technical/game-programming/swept-aabb-collision-detection-and-response-r3084
	THREE.Box3.prototype.isIntersectionBoxSwept = function() {
		var aux1 = new THREE.Vector3();
		var aux2 = new THREE.Vector3();
		var auxBox = new THREE.Box3();

		var velocity = new THREE.Vector3();
		var invEntry = new THREE.Vector3();
		var invExit = new THREE.Vector3();
		var entry = new THREE.Vector3();
		var exit = new THREE.Vector3();
		var size1 = new THREE.Vector3();
		var size2 = new THREE.Vector3();

		return function(oldPos, newPos, box, boxPos, point) {
			velocity.copy(newPos).sub(oldPos);
			aux1.copy(this.min).add(velocity);
			aux2.copy(this.max).add(velocity);
			auxBox.setFromPoints([this.min, this.max, aux1, aux2]);

			if (!auxBox.isIntersectionBox(box)) {
				return false;
			}

			if (this.isIntersectionBox(box)) {
				point.copy(oldPos);
				return true;
			}

			auxBox.min.copy(this.min).add(velocity);
			auxBox.max.copy(this.max).add(velocity);

			if (auxBox.isIntersectionBox(box)) {
				point.copy(newPos);
				return true;
			}

			size1.copy(this.max).sub(this.min);
			size2.copy(box.max).sub(box.min);

			if (velocity.x > 0) {
				invEntry.x = box.min.x - (this.min.x + size1.x);
				invExit.x = (box.min.x + size2.x) - this.min.x;
			} else {
				invEntry.x = (box.min.x + size2.x) - this.min.x;
				invExit.x = box.min.x - (this.min.x + size1.x);
			}
			if (velocity.y > 0) {
				invEntry.y = box.min.y - (this.min.y + size1.y);
				invExit.y = (box.min.y + size2.y) - this.min.y;
			} else {
				invEntry.y = (box.min.y + size2.y) - this.min.y;
				invExit.y = box.min.y - (this.min.y + size1.y);
			}
			if (velocity.z > 0) {
				invEntry.z = box.min.z - (this.min.z + size1.z);
				invExit.z = (box.min.z + size2.z) - this.min.z;
			} else {
				invEntry.z = (box.min.z + size2.z) - this.min.z;
				invExit.z = box.min.z - (this.min.z + size1.z);
			}

			if (velocity.x === 0) {
				entry.x = -Infinity;
				exit.x = Infinity;
			} else {
				entry.x = invEntry.x / velocity.x;
				exit.x = invExit.x / velocity.x;
			}
			if (velocity.y === 0) {
				entry.y = -Infinity;
				exit.y = Infinity;
			} else {
				entry.y = invEntry.y / velocity.y;
				exit.y = invExit.y / velocity.y;
			}
			if (velocity.z === 0) {
				entry.z = -Infinity;
				exit.z = Infinity;
			} else {
				entry.z = invEntry.z / velocity.z;
				exit.z = invExit.z / velocity.z;
			}

			var entryTime = entry.maxCoord();
			var exitTime = exit.minCoord();

			if (entryTime > exitTime || entry.x < 0 && entry.y < 0 && entry.z < 0 || entry.x > 1 || entry.y > 1 || entry.z > 1) {
				return false;
			} else {
				velocity.multiplyScalar(entryTime);
				point.copy(oldPos).add(velocity);
				return true;
			}
		}
	}();

	THREE.Ray.prototype.intersectsOrStartsInBox = function(box, optionalTarget) {
		var result = optionalTarget || new THREE.Vector3();

		if (box.containsPoint(this.origin)) {
			result.copy(this.origin);
		} else {
			this.intersectBox(box, result);
		}

		return result;
	};

	// Vector2

	THREE.Vector2.prototype.toString = function(d) {
		d = d || 0;
		return ["[", this.x.toFixed(d), this.y.toFixed(d), "]"].join(" ");
	};

	THREE.Vector2.prototype.equalsEpsilon = function(v, e) {
		e = e || 0.0001;
		return (Math.abs(v.x - this.x) < e &&
				Math.abs(v.y - this.y) < e);
	};

	THREE.Vector2.prototype.minCoord = function() {
		return Math.min(this.x, this.y);
	};

	THREE.Vector2.prototype.maxCoord = function() {
		return Math.max(this.x, this.y);
	};

	// http://www.gamedev.net/page/resources/_/technical/game-programming/swept-aabb-collision-detection-and-response-r3084
	THREE.Box2.prototype.isIntersectionBoxSwept = function() {
		var aux1 = new THREE.Vector2();
		var aux2 = new THREE.Vector2();
		var auxBox = new THREE.Box2();

		var velocity = new THREE.Vector2();
		var invEntry = new THREE.Vector2();
		var invExit = new THREE.Vector2();
		var entry = new THREE.Vector2();
		var exit = new THREE.Vector2();
		var size1 = new THREE.Vector2();
		var size2 = new THREE.Vector2();

		return function(oldPos, newPos, box, boxPos, point) {
			velocity.copy(newPos).sub(oldPos);
			aux1.copy(this.min).add(velocity);
			aux2.copy(this.max).add(velocity);
			auxBox.setFromPoints([this.min, this.max, aux1, aux2]);

			if (!auxBox.isIntersectionBox(box)) {
				return false;
			}

			if (this.isIntersectionBox(box)) {
				point.copy(oldPos);
				return true;
			}

			auxBox.min.copy(this.min).add(velocity);
			auxBox.max.copy(this.max).add(velocity);

			if (auxBox.isIntersectionBox(box)) {
				point.copy(newPos);
				return true;
			}

			size1.copy(this.max).sub(this.min);
			size2.copy(box.max).sub(box.min);

			if (velocity.x > 0) {
				invEntry.x = box.min.x - (this.min.x + size1.x);
				invExit.x = (box.min.x + size2.x) - this.min.x;
			} else {
				invEntry.x = (box.min.x + size2.x) - this.min.x;
				invExit.x = box.min.x - (this.min.x + size1.x);
			}
			if (velocity.y > 0) {
				invEntry.y = box.min.y - (this.min.y + size1.y);
				invExit.y = (box.min.y + size2.y) - this.min.y;
			} else {
				invEntry.y = (box.min.y + size2.y) - this.min.y;
				invExit.y = box.min.y - (this.min.y + size1.y);
			}

			if (velocity.x === 0) {
				entry.x = -Infinity;
				exit.x = Infinity;
			} else {
				entry.x = invEntry.x / velocity.x;
				exit.x = invExit.x / velocity.x;
			}
			if (velocity.y === 0) {
				entry.y = -Infinity;
				exit.y = Infinity;
			} else {
				entry.y = invEntry.y / velocity.y;
				exit.y = invExit.y / velocity.y;
			}

			var entryTime = entry.maxCoord();
			var exitTime = exit.minCoord();

			if (entryTime > exitTime || entry.x < 0 && entry.y < 0 || entry.x > 1 || entry.y > 1) {
				return false;
			} else {
				velocity.multiplyScalar(entryTime);
				point.copy(oldPos).add(velocity);
				return true;
			}
		}
	}();

	// http://gamedev.stackexchange.com/questions/29479/swept-aabb-vs-line-segment-2d
	THREE.Box2.prototype.isIntersectionLineSwept = function() {
		var velocity = new THREE.Vector2();
		var boxExtent = new THREE.Vector2();
		var boxCenter = new THREE.Vector2();
		var lineNormal = new THREE.Vector2();
		var lineDir = new THREE.Vector2();
		var lineMin = new THREE.Vector2();
		var lineMax = new THREE.Vector2();
		var aux = new THREE.Vector2();

		return function(oldPos, newPos, line) {
			var result = {
				foundCollision: false,
				pos: new THREE.Vector2(),
				distance: 0,
				normal: new THREE.Vector2(),
			};

			velocity.copy(newPos).sub(oldPos);

			boxExtent.copy(this.max).sub(this.min).multiplyScalar(0.5);
			boxCenter.copy(this.max).add(this.min).multiplyScalar(0.5);
			GS.MathHelper.vec2Normal(line.start, line.end, lineNormal);

			if (lineNormal.dot(velocity) >= 0) {
				return result;
			}

			lineDir.copy(line.end).sub(line.start);

			if (lineDir.x > 0) {
				lineMin.x = line.start.x;
				lineMax.x = line.end.x;
			}
			else {
				lineMin.x = line.end.x;
				lineMax.x = line.start.x;
			}

			if (lineDir.y > 0) {
				lineMin.y = line.start.y;
				lineMax.y = line.end.y;
			}
			else {
				lineMin.y = line.end.y;
				lineMax.y = line.start.y;
			}

			var hitTime = 0;
			var outTime = 1;

			var r = boxExtent.x * Math.abs(lineNormal.x) + boxExtent.y * Math.abs(lineNormal.y);
			aux.copy(line.start).sub(boxCenter);
			var boxProj = aux.dot(lineNormal);
			var velProj = velocity.dot(lineNormal);

			if (velProj < 0) {
				r *= -1;
			}

			hitTime = Math.max((boxProj - r) / velProj, hitTime);
			outTime = Math.min((boxProj + r) / velProj, outTime);

			if (velocity.x < 0) {
				if (this.max.x < lineMin.x) {
					return result;
				}

				hitTime = Math.max((lineMax.x - this.min.x) / velocity.x, hitTime);
				outTime = Math.min((lineMin.x - this.max.x) / velocity.x, outTime);
			}
			else
			if (velocity.x > 0) {
				if (this.min.x > lineMax.x) { 
					return result;
				}
				hitTime = Math.max((lineMin.x - this.max.x) / velocity.x, hitTime);
				outTime = Math.min((lineMax.x - this.min.x) / velocity.x, outTime);
			}
			else
			if (lineMin.x > this.max.x || lineMax.x < this.min.x) {
				return result;
			}

			if (hitTime > outTime) {
				return result;
			}

			if (velocity.y < 0) {
				if (this.max.y < lineMin.y) { 
					return result;
				}

				hitTime = Math.max((lineMax.y - this.min.y) / velocity.y, hitTime);
				outTime = Math.min((lineMin.y - this.max.y) / velocity.y, outTime);
			}
			else 
			if (velocity.y > 0) {
				if (this.min.y > lineMax.y) { 
					return result;
				}

				hitTime = Math.max((lineMin.y - this.max.y) / velocity.y, hitTime);
				outTime = Math.min((lineMax.y - this.min.y) / velocity.y, outTime);
			}
			else
			if (lineMin.y > this.max.y || lineMax.y < this.min.y) { 
				return result;
			}

			if (hitTime > outTime) { 
				return result;
			}

			result.foundCollision = true;
			result.pos.copy(oldPos).add(velocity.multiplyScalar(hitTime));
			result.distance = velocity.length() * hitTime;
			result.normal.copy(lineNormal);

			return result;
		}
	}();

	// Geometry

	THREE.Geometry.prototype.merge = function ( geometry, matrix, materialIndexOffset ) {

		if ( geometry instanceof THREE.Geometry === false ) {

			console.error( 'THREE.Geometry.merge(): geometry not an instance of THREE.Geometry.', geometry );
			return;

		}

		var normalMatrix,
		vertexOffset = this.vertices.length,
		vertices1 = this.vertices,
		vertices2 = geometry.vertices,
		faces1 = this.faces,
		faces2 = geometry.faces,
		uvs1 = this.faceVertexUvs[ 0 ],
		uvs2 = geometry.faceVertexUvs[ 0 ];

		if ( materialIndexOffset === undefined ) materialIndexOffset = 0;

		if ( matrix !== undefined ) {

			normalMatrix = new THREE.Matrix3().getNormalMatrix( matrix );

		}

		// vertices

		for ( var i = 0, il = vertices2.length; i < il; i ++ ) {

			var vertex = vertices2[ i ];

			var vertexCopy = vertex.clone();

			if ( matrix !== undefined ) vertexCopy.applyMatrix4( matrix );

			vertices1.push( vertexCopy );

		}

		// faces

		for ( i = 0, il = faces2.length; i < il; i ++ ) {

			var face = faces2[ i ], faceCopy, normal, color,
			faceVertexNormals = face.vertexNormals,
			faceVertexColors = face.vertexColors;

			faceCopy = new THREE.Face3( face.a + vertexOffset, face.b + vertexOffset, face.c + vertexOffset );
			faceCopy.normal.copy( face.normal );

			if ( normalMatrix !== undefined ) {

				faceCopy.normal.applyMatrix3( normalMatrix ).normalize();

			}

			for ( var j = 0, jl = faceVertexNormals.length; j < jl; j ++ ) {

				normal = faceVertexNormals[ j ].clone();

				if ( normalMatrix !== undefined ) {

					normal.applyMatrix3( normalMatrix ).normalize();

				}

				faceCopy.vertexNormals.push( normal );

			}

			faceCopy.color.copy( face.color );
			faceCopy.emissive = face.emissive.clone();

			for ( var j = 0, jl = faceVertexColors.length; j < jl; j ++ ) {

				color = faceVertexColors[ j ];
				faceCopy.vertexColors.push( color.clone() );

			}

			faceCopy.materialIndex = face.materialIndex + materialIndexOffset;

			faces1.push( faceCopy );

		}

		// uvs

		for ( i = 0, il = uvs2.length; i < il; i ++ ) {

			var uv = uvs2[ i ], uvCopy = [];

			if ( uv === undefined ) {

				continue;

			}

			for ( var j = 0, jl = uv.length; j < jl; j ++ ) {

				uvCopy.push( new THREE.Vector2( uv[ j ].x, uv[ j ].y ) );

			}

			uvs1.push( uvCopy );

		}

	};

	// BufferGeometry
	// jshint ignore:start

	THREE.BufferGeometry.prototype.fromGeometry = function ( geometry, settings ) {		

		settings = settings || { 'vertexColors': THREE.NoColors };

		var vertices = geometry.vertices;
		var faces = geometry.faces;
		var faceVertexUvs = geometry.faceVertexUvs;
		var vertexColors = settings.vertexColors;
		var hasFaceVertexUv = faceVertexUvs[ 0 ].length > 0;
		var hasFaceVertexNormals = faces[ 0 ].vertexNormals.length == 3;

		var positions = new Float32Array( faces.length * 3 * 3 );
		this.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

		var normals = new Float32Array( faces.length * 3 * 3 );
		this.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );

		if ( vertexColors !== THREE.NoColors ) {

			var colors = new Float32Array( faces.length * 3 * 3 );
			this.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

			var emissives = new Float32Array( faces.length * 3 * 3 );
			this.addAttribute( 'emissive', new THREE.BufferAttribute( emissives, 3 ) );

		}

		if ( hasFaceVertexUv === true ) {

			var uvs = new Float32Array( faces.length * 3 * 2 );
			this.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

		}

		for ( var i = 0, i2 = 0, i3 = 0; i < faces.length; i ++, i2 += 6, i3 += 9 ) {

			var face = faces[ i ];

			var a = vertices[ face.a ];
			var b = vertices[ face.b ];
			var c = vertices[ face.c ];

			positions[ i3     ] = a.x;
			positions[ i3 + 1 ] = a.y;
			positions[ i3 + 2 ] = a.z;

			positions[ i3 + 3 ] = b.x;
			positions[ i3 + 4 ] = b.y;
			positions[ i3 + 5 ] = b.z;

			positions[ i3 + 6 ] = c.x;
			positions[ i3 + 7 ] = c.y;
			positions[ i3 + 8 ] = c.z;

			if ( hasFaceVertexNormals === true ) {

				var na = face.vertexNormals[ 0 ];
				var nb = face.vertexNormals[ 1 ];
				var nc = face.vertexNormals[ 2 ];

				normals[ i3     ] = na.x;
				normals[ i3 + 1 ] = na.y;
				normals[ i3 + 2 ] = na.z;

				normals[ i3 + 3 ] = nb.x;
				normals[ i3 + 4 ] = nb.y;
				normals[ i3 + 5 ] = nb.z;

				normals[ i3 + 6 ] = nc.x;
				normals[ i3 + 7 ] = nc.y;
				normals[ i3 + 8 ] = nc.z;

			} else {

				var n = face.normal;

				normals[ i3     ] = n.x;
				normals[ i3 + 1 ] = n.y;
				normals[ i3 + 2 ] = n.z;

				normals[ i3 + 3 ] = n.x;
				normals[ i3 + 4 ] = n.y;
				normals[ i3 + 5 ] = n.z;

				normals[ i3 + 6 ] = n.x;
				normals[ i3 + 7 ] = n.y;
				normals[ i3 + 8 ] = n.z;

			}

			if ( vertexColors === THREE.FaceColors ) {

				var fc = face.color;

				colors[ i3     ] = fc.r;
				colors[ i3 + 1 ] = fc.g;
				colors[ i3 + 2 ] = fc.b;

				colors[ i3 + 3 ] = fc.r;
				colors[ i3 + 4 ] = fc.g;
				colors[ i3 + 5 ] = fc.b;

				colors[ i3 + 6 ] = fc.r;
				colors[ i3 + 7 ] = fc.g;
				colors[ i3 + 8 ] = fc.b;

				var em = face.emissive;

				emissives[ i3     ] = em.r;
				emissives[ i3 + 1 ] = em.g;
				emissives[ i3 + 2 ] = em.b;

				emissives[ i3 + 3 ] = em.r;
				emissives[ i3 + 4 ] = em.g;
				emissives[ i3 + 5 ] = em.b;

				emissives[ i3 + 6 ] = em.r;
				emissives[ i3 + 7 ] = em.g;
				emissives[ i3 + 8 ] = em.b;

			} else if ( vertexColors === THREE.VertexColors ) {

				var vca = face.vertexColors[ 0 ];
				var vcb = face.vertexColors[ 1 ];
				var vcc = face.vertexColors[ 2 ];

				colors[ i3     ] = vca.r;
				colors[ i3 + 1 ] = vca.g;
				colors[ i3 + 2 ] = vca.b;

				colors[ i3 + 3 ] = vcb.r;
				colors[ i3 + 4 ] = vcb.g;
				colors[ i3 + 5 ] = vcb.b;

				colors[ i3 + 6 ] = vcc.r;
				colors[ i3 + 7 ] = vcc.g;
				colors[ i3 + 8 ] = vcc.b;

			}

			if ( hasFaceVertexUv === true ) {

				var uva = faceVertexUvs[ 0 ][ i ][ 0 ];
				var uvb = faceVertexUvs[ 0 ][ i ][ 1 ];
				var uvc = faceVertexUvs[ 0 ][ i ][ 2 ];

				uvs[ i2     ] = uva.x;
				uvs[ i2 + 1 ] = uva.y;

				uvs[ i2 + 2 ] = uvb.x;
				uvs[ i2 + 3 ] = uvb.y;

				uvs[ i2 + 4 ] = uvc.x;
				uvs[ i2 + 5 ] = uvc.y;

			}

		}

		this.computeBoundingSphere()

		return this;

	};

	// jshint ignore:end

}());
