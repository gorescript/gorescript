// Polygon detection from line segments

// retrieves non-overlapping polygons for induced graphs with N <= 100 cycles using the Bron–Kerbosch algorithm
// for graphs with N > 100 cycles uses Horton's algorithm as a fallback

// based on the algorithm described in "Polygon Detection from a Set of Lines":
// http://www.researchgate.net/publication/2933997_Polygon_Detection_from_a_Set_of_Lines/file/79e41507ddec7cc0ae.pdf

GS.PolygonHelper = {
	getPolygonsFromLineSegments: function(segments, gridCellSize) {
		var graph = GS.LineHelper.lineSegmentsToGraph(segments, gridCellSize);
		
		graph.computeShortestPaths();	
		graph.computeMinimumCycleBasis();
		graph.removeNonCycleEdges();

		var vertices = graph.vertices;
		var polygons = [];
		var mcb = graph.minimumCycleBasis;
		for (var i = 0; i < mcb.length; i++) {
			var cycle = graph.cycles[mcb[i]].elements;
			polygons[i] = [];
			for (var j = 0; j < cycle.length; j++) {
				polygons[i].push(vertices[cycle[j].start]);
			}
		}

		return {
			vertices: vertices,
			polygons: polygons,
			graph: graph,
		};
	},

	getTriangulatedPolygonsFromLineSegments: function(segments, gridCellSize) {
		var result = this.getPolygonsFromLineSegments(segments, gridCellSize);
		
		var polygons = [];
		for (var i = 0; i < result.polygons.length; i++) {
			var polygon = result.polygons[i];
			var vertices = this.vector2ToVertexArray(polygon);
			if (this.areVerticesClockwise(vertices)) {
				this.reverseVertices(vertices);
			}
			result.polygons[i] = {
				vertices: this.vertexToVector2Array(vertices),
				indices: PolyK.Triangulate(vertices),
				area: PolyK.GetArea(vertices),
			};
		}

		result.polygons.sort(function(a, b) {
			return b.area - a.area;
		});

		return result;
	},

	vector2ToVertexArray: function(vectors) {
		var vertices = [];
		for (var j = 0; j < vectors.length; j++) {
			vertices.push(vectors[j].x);
			vertices.push(vectors[j].y);
		}
		return vertices;
	},

	vertexToVector2Array: function(vertices) {
		var vectors = [];
		for (var i = 0; i < vertices.length; i += 2) {
			vectors.push(new THREE.Vector2(vertices[i], vertices[i + 1]));
		}
		return vectors;
	},

	reverseVertices: function(vertices) {
		for (var i = 0; i < vertices.length / 2; i += 2) {
			var j = vertices.length - i - 2;
			var x = vertices[i];
			vertices[i] = vertices[j];
			vertices[j] = x;
			var y = vertices[i + 1];
			vertices[i + 1] = vertices[j + 1];
			vertices[j + 1] = y;
		}
	},

	areVerticesClockwise: function(vertices) {
		var sum = 0;
		for (var i = 0; i < vertices.length - 2; i += 2) {
			var x1 = vertices[i];
			var y1 = vertices[i + 1];
			var x2 = vertices[i + 2];
			var y2 = vertices[i + 3];
			sum += (x2 - x1) * (y2 + y1);
		}
		var x1 = vertices[vertices.length - 2];
		var y1 = vertices[vertices.length - 1];
		var x2 = vertices[0];
		var y2 = vertices[1];
		sum += (x2 - x1) * (y2 + y1);
		return sum >= 0;
	},	

	// https://dl.dropboxusercontent.com/u/705999/polyfinder/index.html
	sectorContainsPoint: function(sector, p, useCollisionVertices) {
		var v = useCollisionVertices ? sector.collisionVertices : sector.vertices;
		var n = v.length;
		var c = false;

		var i, j = 0;
		for (i = 0, j = n - 1; i < n; j = i++) {
			var start = v[i];
			var end = v[j];

			if (((start.y > p.y) != (end.y > p.y)) &&
				(p.x < (end.x - start.x) * (p.y - start.y) / (end.y - start.y) + start.x)) {
				c = !c;
			}
		}

		return c;
	},

	intersectionSectorBox: function() {
		var box0 = new THREE.Box2();
		var seg0 = { start: new THREE.Vector2(), end: new THREE.Vector2() };
		var p = new THREE.Vector2();
		var boxPoints = [
			new THREE.Vector2(),
			new THREE.Vector2(),
			new THREE.Vector2(),
			new THREE.Vector2(),
		];

		return function(sector, box) {
			box0.setFromPoints(sector.vertices);

			if (!box.isIntersectionBox(box0)) {
				return false;
			}
			if (box.containsBox(box0)) {
				return true;
			}

			boxPoints[0].x = box.min.x; boxPoints[0].y = box.min.y;
			boxPoints[1].x = box.max.x; boxPoints[1].y = box.min.y;
			boxPoints[2].x = box.max.x; boxPoints[2].y = box.max.y;
			boxPoints[3].x = box.min.x; boxPoints[3].y = box.max.y;

			var v0, v1, v2;
			for (var i = 0; i < sector.indices.length; i += 3) {
				v0 = sector.vertices[sector.indices[i]];
				v1 = sector.vertices[sector.indices[i + 1]];
				v2 = sector.vertices[sector.indices[i + 2]];

				for (var j = 0; j < 4; j++) {
					if (GS.MathHelper.pointInTriangle(boxPoints[j], v0, v1, v2)) {
						return true;
					}
				}
			}

			for (var i = 0; i < sector.vertices.length - 1; i++) {
				seg0.start.copy(sector.vertices[i]);
				seg0.end.copy(sector.vertices[i + 1]);
				if (GS.LineHelper.intersectionLineSegmentBox(seg0, box)) {
					return true;
				}
			}
			seg0.start.copy(sector.vertices[sector.vertices.length - 1]);
			seg0.end.copy(sector.vertices[0]);
			if (GS.LineHelper.intersectionLineSegmentBox(seg0, box)) {
				return true;
			}

			return false;
		};
	}(),

	retriangulateSectors: function(sectors) {
		function sectorEdgeContainsVertex(a, v) {
			var result = { edgeIndex: 0, offset: 0 };
			var i, offset;

			for (i = 0; i < a.vertices.length - 1; i++) {
				if (a.vertices[i].equalsEpsilon(v) || a.vertices[i + 1].equalsEpsilon(v)) {
					return undefined;
				}
				offset = GS.LineHelper.pointOffsetOnLineSegment({ start: a.vertices[i], end: a.vertices[i + 1] }, v);
				if (offset != -1) {
					result.edgeIndex = i;
					result.offset = offset;
					return result;
				}
			}

			if (a.vertices[i].equalsEpsilon(v) || a.vertices[0].equalsEpsilon(v)) {
				return undefined;
			}
			offset = GS.LineHelper.pointOffsetOnLineSegment({ start: a.vertices[i], end: a.vertices[0] }, v);
			if (offset != -1) {
				result.edgeIndex = i;
				result.offset = offset;
				return result;
			}

			return undefined;
		}

		function edgeSetEquals(a, b) {
			return a.vertex.equalsEpsilon(b.vertex);
		}

		function sortCompare(a, b) {
			return b.offset - a.offset;
		}

		function getSectorEdgeIndex(a, start, end) {
			for (var i = 0; i < a.vertices.length - 1; i++) {
				if (a.vertices[i].equalsEpsilon(start) && a.vertices[i + 1].equalsEpsilon(end)) {
					return i;
				}
			}
			if (a.vertices[i].equalsEpsilon(start) && a.vertices[0].equalsEpsilon(end)) {
				return i;
			}
			return -1;
		}

		function addVerticesToSector(a, v) {
			var edgeIndex = getSectorEdgeIndex(a, v.edgeStart, v.edgeEnd);
			if (edgeIndex != -1) {
				for (var i = 0; i < v.vertices.length; i++) {
					a.vertices.splice(edgeIndex + 1, 0, v.vertices[i]);
				}
			}
		}

		var sectorEdges = [];
		for (var i = 0; i < sectors.length; i++) {
			var edges = [];
			for (var j = 0; j < sectors[i].vertices.length; j++) {
				edges.push(new GS.Set([], edgeSetEquals));
			}
			sectorEdges.push(edges);
		}

		function addVertices(aIndex, bIndex) {
			var a = sectors[aIndex];
			var b = sectors[bIndex];

			for (var i = 0; i < b.vertices.length; i++) {
				var result = sectorEdgeContainsVertex(a, b.vertices[i]);
				if (result !== undefined) {
					var edges = sectorEdges[aIndex];
					edges[result.edgeIndex].add({
						vertex: b.vertices[i],
						offset: result.offset,
					});
				}
			}
		}

		for (var i = 0; i < sectors.length - 1; i++) {
			for (var j = i + 1; j < sectors.length; j++) {
				if (i != j) {
					addVertices(i, j);
					addVertices(j, i);
				}
			}
		}		

		for (var i = 0; i < sectors.length; i++) {
			var toAdd = [];
			var n = sectors[i].vertices.length;
			for (var j = 0; j < n; j++) {
				var newPoints = sectorEdges[i][j].elements;
				if (newPoints.length > 0) {
					newPoints.sort(sortCompare);
					var item = { vertices: [], edgeStart: sectors[i].vertices[j], edgeEnd: sectors[i].vertices[(j == n - 1) ? 0 : (j + 1)] };
					for (var k = 0; k < newPoints.length; k++) {
						item.vertices.push(newPoints[k].vertex);
					}
					toAdd.push(item);
				}
			}

			for (var j = 0; j < toAdd.length; j++) {
				addVerticesToSector(sectors[i], toAdd[j]);
			}

			var vertices = this.vector2ToVertexArray(sectors[i].vertices);
			if (this.areVerticesClockwise(vertices)) {
				this.reverseVertices(vertices);
			}
			sectors[i].vertices = this.vertexToVector2Array(vertices);
			sectors[i].indices = PolyK.Triangulate(vertices);
		}
	},

	retriangulateSegments: function(segments) {
		function rightSideCompare(a, b) {
			return b - a;
		}

		function leftSideCompare(a, b) {
			return a - b;
		}

		function addVertices(seg, endPoint, compare) {
			var points = new GS.Set();

			for (var i = 0; i < segments.length; i++) {
				var s = segments[i];
				if (s === seg) {
					continue;
				}
				if (!s.start.equalsEpsilon(endPoint) && !s.end.equalsEpsilon(endPoint)) {
					continue;
				}

				if (s.topY < seg.topY && s.topY > seg.bottomY) {
					points.add(s.topY);
				}
				if (s.bottomY < seg.topY && s.bottomY > seg.bottomY) {
					points.add(s.bottomY);
				}
			}

			if (points.elements.length > 0) {
				points.elements.sort(compare);
				for (var i = 0; i < points.elements.length; i++) {
					seg.vertices.push(new THREE.Vector3(endPoint.x, points.elements[i], endPoint.y));
				}
			}

			return points.elements.length;
		}

		for (var i = 0; i < segments.length; i++) {
			var seg = segments[i];

			if (seg.type === GS.SegmentTypes.TVScreen || seg.type === GS.SegmentTypes.Switch) {
				continue;
			}

			seg.indices = [0, 1, 2];

			seg.vertices = [
				new THREE.Vector3(seg.start.x, seg.topY, seg.start.y),
				new THREE.Vector3(seg.end.x, seg.topY, seg.end.y),
			];

			var n = addVertices(seg, seg.end, rightSideCompare);
			if (n > 0) {
				for (var j = 0; j < n; j++) {
					seg.indices.push(0);
					seg.indices.push(j + 2);
					seg.indices.push(j + 3);
				}
			}

			seg.vertices.push(new THREE.Vector3(seg.end.x, seg.bottomY, seg.end.y));
			seg.vertices.push(new THREE.Vector3(seg.start.x, seg.bottomY, seg.start.y));

			var m = seg.vertices.length - 2;
			n = addVertices(seg, seg.start, leftSideCompare);
			if (n > 0) {
				for (var j = 0; j < n; j++) {
					seg.indices.push(m);
					seg.indices.push(m + j + 1);
					seg.indices.push(m + j + 2);
				}
			}
			seg.indices.push(m);
			seg.indices.push(m + n + 1);
			seg.indices.push(0);

			seg.bottomRightIndex = m;
		}
	},

	// http://www.emanueleferonato.com/2013/10/24/get-simpler-polygons-by-removing-collinear-points/
	detriangulateSectors: function(sectors) {
		for (var i = 0; i < sectors.length; i++) {
			var sector = sectors[i];
			var points = [ sector.vertices[0] ];
			var n = sector.vertices.length;

			for (var j = 1; j < n; j++) {
				if (j < n - 1) {
					if (!GS.LineHelper.arePointsCollinear(sector.vertices[j - 1], sector.vertices[j], sector.vertices[j + 1])) {
						points.push(sector.vertices[j]);
					}
				} else {
					points.push(sector.vertices[j]);
				}
			}

			var vertices = this.vector2ToVertexArray(points);
			if (this.areVerticesClockwise(vertices)) {
				this.reverseVertices(vertices);
			}			
			sector.collisionVertices = this.vertexToVector2Array(vertices);
			sector.collisionIndices = PolyK.Triangulate(vertices);
		}
	},
};

GS.Graph = function(equalsFunc) {
	this.equalsFunc = equalsFunc || function(a, b) { return a == b; };

	this.vertices = [];
	this.edges = [];
};

GS.Graph.prototype = {
	addEdge: function(start, end) {
		if (this.equalsFunc(start, end)) {
			return;
		}

		this.edges.push({
			start: this.addVertex(start),
			end: this.addVertex(end),
		});
	},

	removeEdge: function(start, end) {
		if (this.equalsFunc(start, end)) {
			return;
		}

		var that = this;
		function equals(a, b) {
			return (that.equalsFunc(a.start, b.start) && that.equalsFunc(a.end, b.end) ||
					that.equalsFunc(a.end, b.start) && that.equalsFunc(a.start, b.end));
		}

		var edge = { start: start, end: end };
		for (var i = this.edges.length - 1; i >= 0; i--) {
			if (equals(edge, this.edges[i])) {
				this.edges.splice(i, 1);
			}
		}
	},

	addVertex: function(vertex) {
		var result = this.vertexExists(vertex);
		if (result > -1) {
			return result;
		}
		this.vertices.push(vertex);
		return this.vertices.length - 1;
	},

	vertexExists: function(vertex) {
		for (var i = 0; i < this.vertices.length; i++) {
			if (this.equalsFunc(this.vertices[i], vertex)) {
				return i;
			}
		}
		return -1;
	},

	// Floyd-Warshall: http://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm
	computeShortestPaths: function() {
		var dist = [];
		for (var i = 0; i < this.vertices.length; i++) {
			dist[i] = [];
			for (var j = 0; j < this.vertices.length; j++) {
				dist[i].push(Infinity);
			}
		}
		this.dist = dist;

		var next = [];
		for (var i = 0; i < this.vertices.length; i++) {
			next[i] = [];
			for (var j = 0; j < this.vertices.length; j++) {
				next[i].push(null);
			}
		}
		this.next = next;

		for (var i = 0; i < this.vertices.length; i++) {
			dist[i][i] = 0;
		}
		for (var i = 0; i < this.edges.length; i++) {
			var edge = this.edges[i];
			dist[edge.start][edge.end] = 1;
			dist[edge.end][edge.start] = 1;
		}

		this.initNextArray();

		for (var k = 0; k < this.vertices.length; k++) {
			for (var i = 0; i < this.vertices.length; i++) {
				for (var j = 0; j < this.vertices.length; j++) {
					if (dist[i][k] + dist[k][j] < dist[i][j]) {
						dist[i][j] = dist[i][k] + dist[k][j];
						next[i][j] = next[k][j];
					}
				}
			}
		}
	},

	initNextArray: function() {
		for (var i = 0; i < this.vertices.length; i++) {
			for (var j = 0; j < this.vertices.length; j++) {
				if (i == j || this.dist[i][j] == Infinity) {
					this.next[i][j] = 0;
				} else {
					this.next[i][j] = i;
				}
			}
		}
	},

	getPath: function(i, j) {
		if (i == j) {
			return [];
		}

		var path = this.constructPath(i, j);
		if (path !== undefined) {
			path.unshift(i);
			path.push(j);
		}
		return path;
	},

	constructPath: function(i, j) {
		if (this.dist[i][j] == Infinity) {
			return undefined;
		}

		var intermediate = this.next[i][j];
		if (intermediate == i) {
			return [];
		} else {
			var prev = this.constructPath(i, intermediate);
			var path = [intermediate];
			var next = this.constructPath(intermediate, j);
			if (prev !== undefined) {
				for (var i = prev.length - 1; i >= 0; i--) {
					path.unshift(prev[i]);
				}
			}
			if (next !== undefined) {
				for (var i = 0; i < next.length; i++) {
					path.push(next[i]);
				}
			}
			return path;
		}
	},

	computeVertexNeighborSets: function() {
		var neighborSets = [];

		for (var i = 0; i < this.vertices.length; i++) {
			var v = this.vertices[i];
			var neighbors = new GS.Set();

			for (var j = 0; j < this.edges.length; j++) {
				var edge = this.edges[j];

				if (this.equalsFunc(v, this.vertices[edge.start])) {
					neighbors.add(this.vertices[edge.end]);
				} else
				if (this.equalsFunc(v, this.vertices[edge.end])) {
					neighbors.add(this.vertices[edge.start]);
				}
			}

			neighborSets.push(neighbors);
		}

		this.neighborSets = neighborSets;
	},

	// http://en.wikipedia.org/wiki/Bron%E2%80%93Kerbosch_algorithm
	computeMaximalCliques: function() {
		var that = this;
		this.maximalCliques = [];
		this.computeVertexNeighborSets();

		function bronKerbosch(R, P, X) {
			if (P.elements.length == 0 && X.elements.length == 0) {
				that.maximalCliques.push(R);
			}
			for (var i = 0; i < P.elements.length; i++) {
				var v = P.elements[i];
				var N = that.neighborSets[v];
				bronKerbosch(R.clone().add(v), P.clone().intersection(N), X.clone().intersection(N));
				P.remove(v);
				X.add(v);
			}
		}

		var R = new GS.Set(undefined, this.equalsFunc);
		var P = new GS.Set(this.vertices, this.equalsFunc);
		var X = new GS.Set(undefined, this.equalsFunc);
		bronKerbosch(R, P, X);

		this.maximalCliques.sort(function(a, b) {
			return a.length - b.length;
		});
	},

	getVertexIndex: function(vertex) {
		for (var i = 0; i < this.vertices.length; i++) {
			if (this.equalsFunc(this.vertices[i], vertex)) {
				return i;
			}
		}
		return -1;
	},
};

GS.PlanarGraph = function() {
	GS.Graph.call(this);

	var epsilon = 0.0001;
	this.equalsFunc = function(a, b) {
		return (Math.abs(a.x - b.x) < epsilon &&
				Math.abs(a.y - b.y) < epsilon);
	};
};

GS.PlanarGraph.prototype = GS.inherit(GS.Graph, {
	computeMinimumCycleBasis: function() {
		this.computeAllCycles();

		if (this.cycles.length > 100) {
			console.log("cycle count > 100; using horton");
			this.selectCyclesHorton();
		} else {
			this.selectCyclesNonOverlapping();
		}
	},

	computeAllCycles: function() {
		var that = this;
		var cycles = [];

		function inCycles(cycle) {
			for (var i = 0; i < cycles.length; i++) {
				if (cycles[i].equals(cycle)) {
					return true;
				}
			}
			return false;
		}

		function equals(a, b) {
			return (a.start == b.start && a.end == b.end ||
					a.end == b.start && b.end == a.start);
		}

		function fromPathSet(set) {
			var a = new GS.Set(undefined, equals);
			var e = set.elements;
			var n = e.length;

			for (var i = 0; i < n - 1; i++) {
				a.add({ start: e[i], end: e[i + 1] });
			}
			a.add({ start: e[n - 1], end: e[0] });

			return a;
		}
		
		var path0 = new GS.Set();
		var path1 = new GS.Set();

		for (var i = 0; i < this.vertices.length; i++) {
			for (var j = 0; j < this.edges.length; j++) {
				var edge = this.edges[j];
				path0.elements = this.getPath(edge.start, i) || [];
				path1.elements = this.getPath(i, edge.end) || [];

				var it = path0.intersection(path1);
				if (it.elements.length == 1 && it.elements[0] == i) {
					var cycle = fromPathSet(path0.union(path1));
					cycle.add(edge);
					if (!inCycles(cycle)) {
						cycles.push(cycle);
					}
				}
			}
		}

		cycles.sort(function(a, b) {
			var weightA = that.getCycleWeight(a);
			var weightB = that.getCycleWeight(b);
			return weightA - weightB;
		});

		this.cycles = cycles;
	},

	getCycleWeight: function(cycle) {
		return cycle.elements.length;
	},

	// https://dl.dropboxusercontent.com/u/705999/polyfinder/index.html
	pointInCycle: function(p, cycle) {
		var v = this.vertices;
		var idx = cycle.elements;
		var n = idx.length - 1;
		var c = false;

		var i, j = 0;
		for (i = 0, j = n - 1; i < n; j = i++) {
			var start = v[idx[i].start];
			var end = v[idx[j].start];

			if (((start.y > p.y) != (end.y > p.y)) &&
				(p.x < (end.x - start.x) * (p.y - start.y) / (end.y - start.y) + start.x)) {
				c = !c;
			}
		}

		return c;
	},

	cyclesOverlap: function(a, b) {
		var center = new THREE.Vector2();
		var edgesA = a.difference(b).elements;
		var v = this.vertices;

		for (var i = 0; i < edgesA.length; i++) {
			var edge = edgesA[i];
			center.x = (v[edge.start].x + v[edge.end].x) / 2;
			center.y = (v[edge.start].y + v[edge.end].y) / 2;

			if (this.pointInCycle(center, b)) {
				return true;
			}
		}

		var edgesB = b.difference(a).elements;

		for (var i = 0; i < edgesB.length; i++) {
			var edge = edgesB[i];
			center.x = (v[edge.start].x + v[edge.end].x) / 2;
			center.y = (v[edge.start].y + v[edge.end].y) / 2;

			if (this.pointInCycle(center, a)) {
				return true;
			}
		}

		return false;
	},	

	selectCyclesNonOverlapping: function() {
		var n = this.cycles.length;

		var graph = new GS.Graph();
		for (var i = 0; i < n; i++) {
			graph.addVertex(i);
		}
		for (var i = 0; i < n - 1; i++) {
			for (var j = i + 1; j < n; j++) {
				graph.addEdge(i, j);
			}
		}

		for (var i = 0; i < n - 1; i++) {
			for (var j = i + 1; j < n; j++) {
				if (this.cyclesOverlap(this.cycles[i], this.cycles[j])) {
					graph.removeEdge(i, j);
				}
			}
		}

		graph.computeMaximalCliques();
		if (graph.maximalCliques.length > 0) {
			this.minimumCycleBasis = graph.maximalCliques[0].elements;
		}		
	},

	// http://prolog.hil.unb.ca:8080/xmlui/bitstream/handle/1882/30807/TR84-026.pdf?sequence=1
	selectCyclesHorton: function() {
		var m = this.cycles.length;
		var n = this.edges.length;

		var matrix = new GS.Matrix(m, n);

		for (var i = 0; i < m; i++) {
			for (var j = 0; j < n; j++) {
				if (this.cycles[i].elemExists(this.edges[j])) {
					matrix.matrix[i][j] = 1;
				}
			}
		}

		matrix.binaryGaussianElimination();
		this.minimumCycleBasis = matrix.getNonZeroRowIndices();
	},

	removeNonCycleEdges: function() {
		this.nonCycleVertices = [];
		for (var i = this.vertices.length - 1; i >= 0; i--) {
			var exists = false;
			for (var j = 0; j < this.cycles.length; j++) {
				var cycle = this.cycles[j];
				if (cycle.elemExists(i)) {
					exists = true;
					break;
				}
			}
			if (!exists) {
				this.nonCycleVertices.push(i);
				for (var j = this.edges.length - 1; j >= 0; j--) {
					var edge = this.edges[j];
					if (edge.start == i || edge.end == i) {
						this.edges.splice(j, 1);
					}
				}
			}
		}
	}
});

GS.Set = function(source, equalsFunc) {
	this.equalsFunc = equalsFunc || function(a, b) { return a == b; };
	this.elements = (source !== undefined) ? source : [];
};

GS.Set.prototype = {
	add: function(elem) {
		if (!this.elemExists(elem)) {
			this.elements.push(elem);
		}
		return this;
	},

	remove: function(elem) {
		for (var i = 0; i < this.elements.length; i++) {
			if (this.equalsFunc(this.elements[i], elem)) {
				this.elements.splice(i, 1);
				break;
			}
		}
		return this;
	},

	elemExists: function(elem) {
		for (var i = 0; i < this.elements.length; i++) {
			if (this.equalsFunc(this.elements[i], elem)) {
				return true;
			}
		}
		return false;
	},

	intersection: function(set) {
		var elements = set.elements;
		var it = [];
		for (var i = 0; i < this.elements.length; i++) {
			for (var j = 0; j < elements.length; j++) {
				if (this.equalsFunc(this.elements[i], elements[j])) {
					it.push(this.elements[i]);
				}
			}
		}
		return new GS.Set(it, this.equalsFunc);
	},

	union: function(set) {
		var un = new GS.Set(this.elements.slice(), this.equalsFunc);
		var elements = set.elements;
		for (var i = 0; i < elements.length; i++) {
			un.add(elements[i]);
		}
		return un;
	},

	difference: function(set) {
		var diff = [];
		for (var i = 0; i < this.elements.length; i++) {
			if (!set.elemExists(this.elements[i])) {
				diff.push(this.elements[i]);
			}
		}
		return new GS.Set(diff, this.equalsFunc);
	},

	equals: function(set) {
		var diff1 = this.difference(set);
		var diff2 = set.difference(this);
		return diff1.elements.length == 0 && diff2.elements.length == 0;
	},

	clone: function() {
		return new GS.Set(this.elements.slice(), this.equalsFunc);
	},
};

GS.Matrix = function(m, n) {	
	var matrix = [];
	for (var i = 0; i < m; i++) {
		matrix[i] = [];
		for (var j = 0; j < n; j++) {
			matrix[i].push(0);
		}
	}
	this.matrix = matrix;
	this.rowCount = m;
	this.columnCount = n;
};

GS.Matrix.prototype = {
	// http://www.cs.umd.edu/~gasarch/TOPICS/factoring/fastgauss.pdf
	binaryGaussianElimination: function() {
		var that = this;
		var addRow = function(r0, r1) {
			for (var i = 0; i < that.columnCount; i++) {
				that.matrix[r0][i] = that.matrix[r0][i] ^ that.matrix[r1][i];
			}
		};

		for (var i = 0; i < this.rowCount; i++) {
			var found = false;
			for (var j = 0; j < this.columnCount; j++) {
				if (this.matrix[i][j] == 1) {
					found = true;
					break;
				}
			}			
			if (found) {
				for (var k = 0; k < this.rowCount; k++) {
					if (k != i) {
						if (this.matrix[k][j] == 1) {
							addRow(k, i);
						}
					}
				}
			}
		}
	},

	clear: function(value) {
		value = value || 0;
		for (var i = 0; i < this.rowCount; i++) {
			for (var j = 0; j < this.columnCount; j++) {
				this.matrix[i][j] = value; 
			}
		}
	},

	getNonZeroRowIndices: function() {
		var rowIndices = [];
		for (var i = 0; i < this.rowCount; i++) {
			var nonZero = false;
			for (var j = 0; j < this.columnCount; j++) {
				if (this.matrix[i][j] > 0) {
					nonZero = true;
					break;
				}
			}
			if (nonZero) {
				rowIndices.push(i);
			}
		}
		return rowIndices;
	},

	toString: function() {
		var str = "";
		for (var i = 0; i < this.rowCount; i++) {
			for (var j = 0; j < this.columnCount; j++) {
				str += this.matrix[i][j] + " ";
			}
			str += "\n";
		}
		return str;
	},
};