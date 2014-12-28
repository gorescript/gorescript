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
		switch (this.lightBehavior) {
			case GS.SectorLightBehaviors.Static:
				break;

			case GS.SectorLightBehaviors.Strobe:
				this.lightCooldown--;
				if (this.lightCooldown == 0) {
					this.lightCooldown = this.lightMaxCooldown;
					this.setLightLevel(this.lightMin + Math.random() * this.lightAbs);
				}
				break;

			case GS.SectorLightBehaviors.Oscillate:
				this.sector.lightLevel += this.lightSpeed * this.lightDelta;
				if (this.sector.lightLevel >= this.lightMax) {
					this.sector.lightLevel = this.lightMax;
					this.lightDelta *= -1;
				}
				if (this.sector.lightLevel <= this.lightMin) {
					this.sector.lightLevel = this.lightMin;
					this.lightDelta *= -1;
				}
				break;

			case GS.SectorLightBehaviors.Twitch:
				if (this.lightCooldown == 0) {
					if (Math.random() <= this.lightFrequency) {
						this.sector.lightLevel = this.lightMin;
						this.lightCooldown = this.lightMaxCooldown;
					} else {
						this.sector.lightLevel = this.lightMax;
					}
				} else {
					this.lightCooldown--;
				}
				break;
		}

		this.getLightColorFromSector(this.lightColor, this.sector);
		if (this.view.mesh.material !== undefined) {
			this.view.mesh.material.emissive.copy(this.lightColor);
		}
		for (var i = 0; i < this.view.mesh.children.length; i++) {
			var material = this.view.mesh.children[i].material;
			if (material.emissive !== undefined) {
				material.emissive.copy(this.lightColor);
			}
		}
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
		this.lightBehavior = GS.SectorLightBehaviors.Strobe;
		this.lightMin = (min !== undefined) ? min : 5;
		this.lightMax = (max !== undefined) ? max : 10;
		this.lightAbs = Math.abs(this.lightMax - this.lightMin);
		this.lightMaxCooldown = GS.msToFrames((cooldown !== undefined) ? cooldown : 100);
		this.lightCooldown = this.lightMaxCooldown;

		return this;
	},

	oscillateLight: function(min, max, speed) {
		this.lightBehavior = GS.SectorLightBehaviors.Oscillate;
		this.lightMin = (min !== undefined) ? min : 0;
		this.lightMax = (max !== undefined) ? max : 10;
		this.lightSpeed = (speed !== undefined) ? speed : 0.1;
		this.lightDelta = 1;

		return this;
	},

	twitchLight: function(min, max, frequency, cooldown) {
		this.lightBehavior = GS.SectorLightBehaviors.Twitch;
		this.lightMin = (min !== undefined) ? min : 0;
		this.lightMax = (max !== undefined) ? max : 10;
		this.lightFrequency = (frequency !== undefined) ? frequency : 0.01;
		this.lightMaxCooldown = GS.msToFrames((cooldown !== undefined) ? cooldown : 100);
		this.lightCooldown = this.lightMaxCooldown;

		return this;		
	},
});