GS.Concrete = function(grid, layer, sourceObj) {
	GS.GridObject.apply(this, arguments);

	if (layer === GS.MapLayers.Sector) {
		this.sector = this.sourceObj;
	}

	this.view = {
		collisionData: {
			triangles: null,
		},
	};
};

GS.Concrete.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.Concrete,
});