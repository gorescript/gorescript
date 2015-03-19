GS.MapLayers = {
	Segment: 0,
	Sector: 2,
	Entity: 3,
	Zone: 4,
};

GS.SegmentTypes = {
	User: 0,
	InteriorFloor: 1,
	InteriorCeiling: 2,
	Exterior: 3,
	TVScreen: 4,
	Switch: 5,
};

GS.MapEntities = {
	"M": { 
		name: "medkit",
		type: "Item",
	},
	"A": {
		name: "ammo",
		type: "Item",
	},
	"H": {
		name: "hyper_blaster",
		type: "Item",
	},
	"D": {
		name: "double_shotgun",
		type: "Item",
	},
	"N": {
		name: "nom",
		type: "Monster",
		animations: {
			walk: 6,
			death: 4,
		},
	},
	"E": {
		name: "eye",
		type: "Monster",
		animations: {
			walk: 4,
			death: 4,
			attack: 2,
		},
	},
    "Q": {
        name: "quad",
        type: "Item",
    },
};