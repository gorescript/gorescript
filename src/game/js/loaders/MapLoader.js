GS.MapScripts = {};

GS.MapLoader = function() {
	this.mapPath = "assets/maps/";
};

GS.MapLoader.prototype = {
	constructor: GS.MapLoader,

	load: function(name, filename, callback) {
		var that = this;
		var path = this.mapPath + filename;

		$.ajax({ 
			url: path, 
			dataType: "text",
			success: function(jsonStr) {
				callback(jsonStr);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				throw errorThrown;
			}
		});
	},

	parse: function(text) {
		var map = JSON.parse(text, function(k, v) {
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

		map.bounds = this.getMapBounds(map);

		return map;		
	},

	getMapBounds: function(map) {
		var points = [];

		var segs = map.layerObjects[GS.MapLayers.Segment];
		for (var i = 0; i < segs.length; i++) {
			var seg = segs[i];
			points.push(new THREE.Vector2().copy(seg.start));
			points.push(new THREE.Vector2().copy(seg.end));
		}

		var sectors = map.layerObjects[GS.MapLayers.Sector];
		for (var i = 0; i < sectors.length; i++) {
			var sector = sectors[i];

			for (var j = 0; j < sector.vertices.length; j++) {
				var vertex = sector.vertices[j];
				points.push(new THREE.Vector2().copy(vertex));
			}
		}

		var bounds = new THREE.Box2();
		bounds.setFromPoints(points);
		return bounds;
	},
};