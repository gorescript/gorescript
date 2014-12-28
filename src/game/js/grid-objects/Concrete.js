GS.SectorLightBehaviors = {
	Static: 0,
	Strobe: 1,
	Oscillate: 2,
	Twitch: 3,
};

GS.Concrete = function(grid, layer, sourceObj) {
	GS.GridObject.apply(this, arguments);

	if (layer === GS.MapLayers.Sector) {
		this.sector = this.sourceObj;
		this.lightBehavior = GS.SectorLightBehaviors.Static;
	}
	this.lightColor = new THREE.Color();

	this.view = {
		collisionData: {
			triangles: null,
		},
	};
};

GS.Concrete.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Concrete,

	update: function() {
	},

	setLightLevel: function(lightLevel) {
		this.sector.lightLevel = lightLevel;

		return this;
	},

	setLightColor: function() {
		var color = new THREE.Color();

		return function(r, g, b) {
			this.sector.lightColor = color.setRGB(r, g, b).getHex();

			return this;
		}
	}(),

	staticLight: function(value) {
		this.lightBehavior = GS.SectorLightBehaviors.Static;
		if (value) {
			this.setLightLevel(value);
		}

		return this;
	},

	strobeLight: function(min, max, cooldown) {
		return this;
	},

	oscillateLight: function(min, max, speed) {
		return this;
	},

	twitchLight: function(min, max, frequency, cooldown) {
		return this;
	},
});