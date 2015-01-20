GS.MapScripts.drencrom = function(gridObjectLibrary) {
	GS.MapScript.apply(this, arguments);

	this.mapName = "drencrom";
	this.maxSecrets = 3;
	this.nextMap = "sacrosanct";
	this.musicTrack = "tower_defense_theme";
};

GS.MapScripts.drencrom.prototype = GS.inherit(GS.MapScript, {
	constructor: GS.MapScripts.drencrom,

	init: function() {
		this.southElevator = this.lib.elevators[92];
		this.southElevator.automatic = false;
		this.southElevator.setPositionDown();

		this.westElevator = this.lib.elevators[248];
		this.westElevator.automatic = false;
		this.westElevator.setPositionDown();

		this.crateCorridorTopDoor = this.lib.doors[174];
		this.crateCorridorDoorsOpened = false;

		this.crateCorridorBottomDoor = this.lib.doors[173];
		this.crateCorridorBottomDoor.automatic = false;
		this.crateCorridorBottomDoor.speed = 2;

		this.rightMonsterDoor = this.lib.doors[100];
		this.rightMonsterDoor.automatic = false;
		this.rightMonsterDoor.speed = 2;

		this.southCorridorDoor = this.lib.doors[40];
		this.southCorridorDoor.automatic = false;

		this.endLeftDoor = this.lib.doors[158];
		this.endLeftDoor.automatic = false;
		this.endLeftDoorOpened = false;

		this.triedToGetBlaster = false;

		this.outsideDoorTop = this.lib.doors[31];
		this.outsideDoorTop.automatic = false;
		this.outsideDoorBottom = this.lib.doors[23];
		this.outsideDoorBottom.automatic = false;

		this.secretCloisterDoor = this.lib.doors[16];
		this.secretCloisterDoorOpened = false;

		this.outsideEntryDoor = this.lib.doors[37];
		this.outsideDoorsOpened = false;

		this.initSwitches();
	},

	initSwitches: function() {
		this.southElevatorSwitch = this.lib.switches[749];
		this.southCorridorSwitch = this.lib.switches[750];
		this.westElevatorSwitch = this.lib.switches[752];
		this.endSwitch = this.lib.switches[754];
	},

	onZoneEnter: function(zone) {
		if (zone.name == "endLeft" && !this.endLeftDoorOpened) {
			this.endLeftDoor.open();
			this.endLeftDoorOpened = true;
		} else 
		if (zone.name == "blaster" && !this.triedToGetBlaster) {
			this.triedToGetBlaster = true;
			this.rightMonsterDoor.openSilent();
			this.foundSecret();
		}
	},

	onZoneLeave: function(zone) {
	},

	onItemPickup: function(item) {
	},

	onPlayerOpenDoor: function(door) {
		if (door === this.outsideEntryDoor && !this.outsideDoorsOpened) {
			this.outsideDoorsOpened = true;
			this.outsideDoorTop.openSilent();
			this.outsideDoorBottom.openSilent();
		} else
		if (door === this.crateCorridorTopDoor && !this.crateCorridorDoorsOpened) {
			this.crateCorridorDoorsOpened = true;
			this.crateCorridorBottomDoor.openSilent();
			this.foundSecret();
		} else
		if (door === this.secretCloisterDoor && !this.secretCloisterDoorOpened) {
			this.secretCloisterDoorOpened = true;
			this.foundSecret();
		}
	},

	onSwitchStateChange: function(switchObj) {
		if (switchObj === this.southElevatorSwitch) {
			this.southElevator.goUp();
		} else
		if (switchObj === this.southCorridorSwitch) {
			this.southCorridorDoor.open();
		} else
		if (switchObj === this.westElevatorSwitch) {
			this.westElevator.goUp();
		} else
		if (switchObj === this.endSwitch) {
			this.mapWon = true;
		}
	},
});