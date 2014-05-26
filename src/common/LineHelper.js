GS.LineHelper = {
	compare: function(p, q) {
		if (p.x == q.x) {
			return p.y - q.y;
		}
		return p.x - q.x;
	},

	slope: function(s) {
		return (s.end.y - s.start.y) / (s.end.x - s.start.x);
	},

	intersectionLineSegments: function() {
		var p0 = new THREE.Vector2();
		return function(s1, s2, p) {
			p = p || p0;
			return this.intersectionLines(s1, s2, p, true);
		}
	}(),

	intersectionLines: function(s1, s2, p, compareLineSegments) {
		var x1 = s1.start.x, x2 = s1.end.x, x3 = s2.start.x, x4 = s2.end.x;
		var y1 = s1.start.y, y2 = s1.end.y, y3 = s2.start.y, y4 = s2.end.y;

		var denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
		if (denom == 0) {
			return false;
		}

		var ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
		var ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

		if (!compareLineSegments || (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1)) {
			p.x = x1 + ua * (x2 - x1);
			p.y = y1 + ua * (y2 - y1);
			return true;
		}

		return false;
	},

	intersectionLineSegmentBox: function() {
		var box0 = new THREE.Box2();
		var seg0 = { start: new THREE.Vector2(), end: new THREE.Vector2() };
		var p = new THREE.Vector2();

		return function(seg, box) {
			box0.setFromPoints([seg.start, seg.end]);

			if (!box.isIntersectionBox(box0)) {
				return false;
			}
			if (box.containsPoint(seg.start) && box.containsPoint(seg.end)) {
				return true;
			}

			seg0.start.x = box.min.x; seg0.start.y = box.min.y; seg0.end.x = box.max.x; seg0.end.y = box.min.y;
			if (this.intersectionLineSegments(seg, seg0, p)) {
				return true;
			}

			seg0.start.x = box.max.x; seg0.start.y = box.min.y; seg0.end.x = box.max.x; seg0.end.y = box.max.y;
			if (this.intersectionLineSegments(seg, seg0, p)) {
				return true;
			}

			seg0.start.x = box.max.x; seg0.start.y = box.max.y; seg0.end.x = box.min.x; seg0.end.y = box.max.y;
			if (this.intersectionLineSegments(seg, seg0, p)) {
				return true;
			}

			seg0.start.x = box.min.x; seg0.start.y = box.max.y; seg0.end.x = box.min.x; seg0.end.y = box.min.y;
			if (this.intersectionLineSegments(seg, seg0, p)) {
				return true;
			}

			return false;
		};
	}(),

	lineSegmentsToGraph: function(segments, gridCellSize) {
		var that = this;

		var graph = new GS.PlanarGraph();

		var p = new THREE.Vector2();
		for (var i = 0; i < segments.length; i++) {
			var cuts = [];
			cuts.push(segments[i].start.clone());
			cuts.push(segments[i].end.clone());

			for (var j = 0; j < segments.length; j++) {
				if (i != j) {
					var result = this.intersectionLineSegments(segments[i], segments[j], p);

					if (result) {
						cuts.push(p.clone());
					}
				}
			}
			cuts.sort(function(a, b) { return that.compare(a, b); });

			for (var j = 0; j < cuts.length - 1; j++) {
				graph.addEdge(cuts[j], cuts[j + 1]);
			}
		}

		if (gridCellSize !== undefined) {
			for (var i = 0; i < graph.vertices.length; i++) {
				var v = graph.vertices[i];
				v.x = Math.floor(v.x / gridCellSize) * gridCellSize;
				v.y = Math.floor(v.y / gridCellSize) * gridCellSize;
			}
		}

		return graph;
	},

	pointOnLineSegment: function(seg, p) {
		var offset = this.pointOffsetOnLineSegment(seg, p);
		return (offset != -1);
	},

	pointOffsetOnLineSegment: function(seg, p) {
		var epsilon = 0.0001;

		var cross = (p.y - seg.start.y) * (seg.end.x - seg.start.x) - (p.x - seg.start.x) * (seg.end.y - seg.start.y);
		if (Math.abs(cross) > epsilon) {
			return -1;
		}

		var dot = (p.x - seg.start.x) * (seg.end.x - seg.start.x) + (p.y - seg.start.y) * (seg.end.y - seg.start.y);
		if (dot < 0) {
			return -1;
		}

		var lengthSq = (seg.end.x - seg.start.x) * (seg.end.x - seg.start.x) + (seg.end.y - seg.start.y) * (seg.end.y - seg.start.y);
		if (dot > lengthSq) {
			return -1;
		}

		var offset = (lengthSq != 0) ? (dot / lengthSq) : 1;
		return offset;
	},

	arePointsCollinear: function(p1, p2, p3) {
		return (p1.y - p2.y) * (p1.x - p3.x) == (p1.y - p3.y) * (p1.x - p2.x);
	}
};