GS.TVScreen = function(grid, seg) {
	GS.GridObject.call(this, grid);

	this.segment = seg;

	this.view = {
	};
};

GS.TVScreen.prototype = GS.inherit(GS.GridObject, {
	constructor: GS.TVScreen,

	init: function() {
	},
});