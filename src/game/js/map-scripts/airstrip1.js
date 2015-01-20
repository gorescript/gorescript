GS.MapScripts.airstrip1 = function(gridObjectLibrary) {
	GS.MapScript.apply(this, arguments);

	this.mapName = "airstrip one";
	this.maxSecrets = 2;
	this.nextMap = "drencrom";
	this.musicTrack = "simple_action_beat";
};

GS.MapScripts.airstrip1.prototype = GS.inherit(GS.MapScript, {
	constructor: GS.MapScripts.airstrip1,

	init: function() {
		this.hallwayClosetOpened = false;
		this.hallwayClosetDoor = this.lib.doors[77];
		this.hallwayClosetDoor.automatic = false;
		this.hallwayClosetDoor.speed = 2;

		this.shotgun = this.lib.items[24];
		this.shotgunClosetDoor = this.lib.doors[150];
		this.shotgunClosetDoor.automatic = false;
		this.shotgunClosetDoor.speed = 2;

		this.hyperBlaster = this.lib.items[85];

		this.courtyardClosetElevator = this.lib.elevators[137];
		this.courtyardClosetElevator.automatic = false;
		this.courtyardClosetElevator.speed = 3;
		this.courtyardClosetElevator.setPositionUp();

		this.courtyardClosetMonsters = this.getGridObjectsById("monsters", [133, 134, 135, 136, 137, 138, 139, 140]);
		for (var i = 0; i < this.courtyardClosetMonsters.length; i++) {
			this.courtyardClosetMonsters[i].state = GS.MonsterStates.Scripted;
		}

		this.courtyardElevators = this.getGridObjectsById("elevators", [95, 96, 97, 98]);
		for (var i = 0; i < this.courtyardElevators.length; i++) {
			this.courtyardElevators[i].downY += 2;
			this.courtyardElevators[i].speed = 1;
			this.courtyardElevators[i].automatic = false;
			this.courtyardElevators[i].setPositionUp();
		}

		this.closetSwitch = this.lib.switches[471];
		this.endSwitch = this.lib.switches[477];

		this.secretDoor1 = this.lib.doors[112];
		this.secretDoor1Opened = false;
		this.secretDoor2 = this.lib.doors[71];
		this.secretDoor2Opened = false;
	},

	onZoneEnter: function(zone) {
		if (zone.name == "closet" && !this.hallwayClosetOpened) {
			this.hallwayClosetDoor.open();
			this.hallwayClosetOpened = true;
		}
	},

	onZoneLeave: function(zone) {
	},

	onItemPickup: function(item) {
		if (item === this.shotgun) {
			this.shotgunClosetDoor.open();
		} else
		if (item === this.hyperBlaster) {
			for (var i = 0; i < this.courtyardClosetMonsters.length; i++) {
				this.courtyardClosetMonsters[i].activate(true);
			}
			this.courtyardClosetElevator.goDown();
		}
	},

	onPlayerOpenDoor: function(door) {
		if (door === this.secretDoor1 && !this.secretDoor1Opened) {
			this.secretDoor1Opened = true;
			this.foundSecret();
		} else
		if (door === this.secretDoor2 && !this.secretDoor2Opened) {
			this.secretDoor2Opened = true;
			this.foundSecret();
		}
	},

	onSwitchStateChange: function(switchObj) {
		if (switchObj === this.closetSwitch) {
			for (var i = 0; i < this.courtyardElevators.length; i++) {
				this.courtyardElevators[i].goDown();				
			}
		} else
		if (switchObj === this.endSwitch) {
			this.mapWon = true;
		}
	},
});