GS.TVScreen = function(grid, seg) {
	GS.GridObject.call(this, grid);

	this.segment = seg;
	this.tvStation = grid.tvStation;

	this.view = {
	};
};

GS.TVScreen.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.TVScreen,

	init: function() {
		this.tvStation.addTVScreen(this);
		this.view.mesh.material = this.tvStation.getMaterial(this);
	},
});