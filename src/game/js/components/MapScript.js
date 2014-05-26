GS.MapScript = function(gridObjectLibrary) {
	this.lib = gridObjectLibrary;
};

GS.MapScript.prototype = {
	constructor: GS.MapScript,

	init: function() {
	},

	update: function() {
	},

	onZoneEnter: function(zone) {
	},

	onZoneLeave: function(zone) {
	},

	onItemPickup: function(item) {
	},

	getGridObjectsById: function(type, idArray) {
		var list = [];
		var source = this.lib[type];
		for (var i in source) {			
			if (idArray.indexOf(parseInt(i, 10)) != -1) {				
				list.push(source[i]);
			}
		}
		return list;
	},
};