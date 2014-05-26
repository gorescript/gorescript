GS.MathHelper = {
	clamp: function(x, min, max) {
		if (x < min) x = min;
		if (x > max) x = max;

		return x;
	},

	// Andrew's monotone chain convex hull algorithm
	// http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
	getConvexHullPoints: function(P) {	
		var cross = function(O, A, B) {
			return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
		};

		var n = P.length;
		var k = 0;
		var H = [];

		P.sort(function(a, b) {	
			if (a.x == b.x) {
				return a.y - b.y;
			}
			return a.x - b.x; 
		});

		for (var i = 0; i < n; i++) {
			while (k >= 2 && cross(H[k - 2], H[k - 1], P[i]) <= 0) {
				k--;
			}
			H[k++] = P[i];
		}
	 
		var t = k + 1;
		for (var i = n - 2; i >= 0; i--) {
			while (k >= t && cross(H[k - 2], H[k - 1], P[i]) <= 0) {
				k--;
			}
			H[k++] = P[i];
		}
	 
		H.length = k - 1;
		return H;
	},

	pointInTriangle: function(P, A, B, C) {
		var result = this.getTriangleBarycentricCoordinates(P, A, B, C);
		return result.inTriangle;
	},

	// Barycentric Technique
	// http://www.blackpawn.com/texts/pointinpoly/
	getTriangleBarycentricCoordinates: function(P, A, B, C) {
		var v0 = new THREE.Vector2().subVectors(C, A);
		var v1 = new THREE.Vector2().subVectors(B, A);
		var v2 = new THREE.Vector2().subVectors(P, A);

		var dot00 = v0.dot(v0);
		var dot01 = v0.dot(v1);
		var dot02 = v0.dot(v2);
		var dot11 = v1.dot(v1);
		var dot12 = v1.dot(v2);

		var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
		var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

		var inTriangle = (u >= 0 && v >= 0 && (u + v < 1));

		return { u: u, v: v, inTriangle: inTriangle };
	},

	vec2Rotate: function(v, angle) {
		var sn = Math.sin(Math.PI / 180 * angle);
		var cs = Math.cos(Math.PI / 180 * angle);

		var x = v.x * cs - v.y * sn;
		var y = v.x * sn + v.y * cs;

		v.x = x;
		v.y = y;
	},

	vec2RotateRadians: function(v, radians) {
		var sn = Math.sin(radians);
		var cs = Math.cos(radians);

		var x = v.x * cs - v.y * sn;
		var y = v.x * sn + v.y * cs;

		v.x = x;
		v.y = y;
	},

	vec2Angle: function(v0, v1) {
		return -Math.atan2(v1.y - v0.y, v1.x - v0.x) * (180 / Math.PI) * 2;
	},

	vec2AngleRadians: function(v0, v1) {
		return -Math.atan2(v1.y - v0.y, v1.x - v0.x) * 2;
	},

	vec2AngleDirected: function(v0, v1) {
		return Math.atan2(v0.y, v0.x) - Math.atan2(v1.y, v1.x);
	},

	vec2Normal: function(v0, v1, optionalTarget) {
		var result = optionalTarget || new THREE.Vector2();

		var dx = v1.x - v0.x;
		var dy = v1.y - v0.y;

		result.set(dy, -dx).normalize();
		return result;
	},

	vec2PointSide: function(a, b, c) {
		return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) > 0;
	},
};

GS.SmoothNumber = function(initialValue, speed) {
	this.value = initialValue;
	this.targetValue = initialValue;
	this.speed = speed;
};

GS.SmoothNumber.prototype = {
	setTargetValue: function(targetValue) {
		this.targetValue = targetValue;
	},

	update: function() {
		if (this.value < this.targetValue) {
			this.value += this.speed;
			if (this.value > this.targetValue) {
				this.value = this.targetValue;
			}
		}
		if (this.value > this.targetValue) {
			this.value -= this.speed;
			if (this.value < this.targetValue) {
				this.value = this.targetValue;
			}
		}
	},
};

GS.SmoothVector3 = function(x, y, z, speed) {
	THREE.Vector3.call(this, x, y, z);

	this.targetValue = this.clone();
	this.speed = (speed !== undefined) ? speed : 0.1;
	this.color = new THREE.Color();
};

GS.SmoothVector3.prototype = GS.inherit(THREE.Vector3, {
	setTargetValue: function(targetValue) {
		this.targetValue = targetValue.clone();
	},

	update: function() {
		this.updateProperty("x");
		this.updateProperty("y");
		this.updateProperty("z");

		this.updateColor();
	},

	updateColor: function() {
		this.color.r = this.x;
		this.color.g = this.y;
		this.color.b = this.z;
	},

	updateProperty: function(name) {
		if (this[name] < this.targetValue[name]) {
			this[name] += this.speed;
			if (this[name] > this.targetValue[name]) {
				this[name] = this.targetValue[name];
			}
		}
		if (this[name] > this.targetValue[name]) {
			this[name] -= this.speed;
			if (this[name] < this.targetValue[name]) {
				this[name] = this.targetValue[name];
			}
		}
	},
});