GS.MapScript = function(gridObjectLibrary) {
	this.lib = gridObjectLibrary;
	
	this.secretsFound = 0;
	this.maxSecrets = 0;
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

	onPlayerOpenDoor: function(door) {
	},

	onSwitchStateChange: function(switchObj) {
	},

	foundSecret: function() {
		this.secretsFound++;
		GS.DebugUI.addTempLine("secret found");
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