GS.MapScripts.sacrosanct = function(gridObjectLibrary) {
	GS.MapScript.apply(this, arguments);

	this.mapName = "sacrosanct";
	this.maxSecrets = 2;
	this.musicTrack = "angry_robot_3";
};

GS.MapScripts.sacrosanct.prototype = GS.inherit(GS.MapScript, {
	constructor: GS.MapScripts.sacrosanct,

	init: function() {
		this.exitElevator1 = this.lib.elevators[215];
		this.exitElevator1.automatic = false;
		this.exitElevator1.setPositionUp();
		this.exitElevator2 = this.lib.elevators[216];
		this.exitElevator2.automatic = false;
		this.exitElevator2.setPositionUp();
		this.exitElevator3 = this.lib.elevators[213];
		this.exitElevator3.automatic = false;
		this.exitElevator3.setPositionUp();

		this.crossElevator = this.lib.elevators[55];
		this.crossElevator.automatic = false;
		this.crossElevator.setPositionDown();

		this.shotgun = this.lib.items[0];

		this.gazeboElevator = this.lib.elevators[146];
		this.gazeboElevator.automatic = false;
		this.gazeboElevator.setPositionUp();

		this.caveDoorLeft1 = this.lib.doors[172];
		this.caveDoorLeft1.automatic = false;
		this.caveDoorLeft1.speed = 2;
		this.caveDoorLeft2 = this.lib.doors[171];
		this.caveDoorLeft2.automatic = false;
		this.caveDoorLeft2.speed = 2;
		this.caveDoorLeft3 = this.lib.doors[169];
		this.caveDoorLeft3.automatic = false;
		this.caveDoorLeft3.speed = 2;
		this.caveDoorLeft4 = this.lib.doors[170];
		this.caveDoorLeft4.automatic = false;
		this.caveDoorLeft4.speed = 2;

		this.caveDoorRight1 = this.lib.doors[182];
		this.caveDoorRight1.automatic = false;
		this.caveDoorRight1.speed = 2;
		this.caveDoorRight2 = this.lib.doors[180];
		this.caveDoorRight2.automatic = false;
		this.caveDoorRight2.speed = 2;
		this.caveDoorRight3 = this.lib.doors[179];
		this.caveDoorRight3.automatic = false;
		this.caveDoorRight3.speed = 2;
		this.caveDoorRight4 = this.lib.doors[181];
		this.caveDoorRight4.automatic = false;
		this.caveDoorRight4.speed = 2;

		this.caveDoorLeftOpened1 = false;
		this.caveDoorLeftOpened2 = false;
		this.caveDoorRightOpened1 = false;
		this.caveDoorRightOpened2 = false;

		this.gazeboClosetDoor1 = this.lib.doors[134];
		this.gazeboClosetDoor1.automatic = false;
		this.gazeboClosetDoor1.speed = 2;		
		this.gazeboClosetDoor2 = this.lib.doors[133];
		this.gazeboClosetDoor2.automatic = false;
		this.gazeboClosetDoor2.speed = 2;

		this.southClosetDoor1 = this.lib.doors[204];
		this.southClosetDoor1.automatic = false;
		this.southClosetDoor1.speed = 2;
		this.southClosetDoor2 = this.lib.doors[209];
		this.southClosetDoor2.automatic = false;
		this.southClosetDoor2.speed = 2;

		this.endSwitch = this.lib.switches[845];
		this.gazeboEndSwitch = this.lib.switches[842];
		this.gazeboElevatorSwitch = this.lib.switches[840];
		this.mazeSwitch = this.lib.switches[848];
		this.southEndSwitch = this.lib.switches[837];
		this.southLeftSwitch = this.lib.switches[836];
		this.southRightSwitch = this.lib.switches[838];
	},

	onZoneEnter: function(zone) {
		if (zone.name == "cave_left1" && !this.caveDoorLeftOpened1) {
			this.caveDoorLeft1.open();
			this.caveDoorLeft2.open();
			this.caveDoorLeftOpened1 = true;
		} else
		if (zone.name == "cave_left2") {
			if (!this.caveDoorLeftOpened2) {
				this.caveDoorLeft3.open();
				this.caveDoorLeft4.open();
				this.caveDoorLeftOpened2 = true;
			}
			if (!this.caveDoorLeftOpened1) {
				this.caveDoorLeft1.open();
				this.caveDoorLeft2.open();
				this.caveDoorLeftOpened1 = true;
			}
		} else
		if (zone.name == "cave_left3" && !this.caveDoorLeftOpened2) {
			this.caveDoorLeft3.open();
			this.caveDoorLeft4.open();
			this.caveDoorLeftOpened2 = true;
		} else
		if (zone.name == "cave_right1" && !this.caveDoorRightOpened1) {
			this.caveDoorRight1.open();
			this.caveDoorRight2.open();
			this.caveDoorRightOpened1 = true;
		} else
		if (zone.name == "cave_right2") {
			if (!this.caveDoorRightOpened2) {
				this.caveDoorRight3.open();
				this.caveDoorRight4.open();
				this.caveDoorRightOpened2 = true;
			}
			if (!this.caveDoorRightOpened1) {
				this.caveDoorRight1.open();
				this.caveDoorRight2.open();
				this.caveDoorRightOpened1 = true;
			}
		} else
		if (zone.name == "cave_right3" && !this.caveDoorRightOpened2) {
			this.caveDoorRight3.open();
			this.caveDoorRight4.open();
			this.caveDoorRightOpened2 = true;
		}
	},

	onZoneLeave: function(zone) {
	},

	onItemPickup: function(item) {
		if (item === this.shotgun) {
			this.crossElevator.goUp();
		}
	},

	onPlayerOpenDoor: function(door) {
	},

	onSwitchStateChange: function(switchObj) {		
		if (switchObj === this.gazeboElevatorSwitch) {
			this.gazeboElevator.goDown();
			this.gazeboClosetDoor1.open();
			this.gazeboClosetDoor2.open();
			this.foundSecret();
		} else
		if (switchObj === this.gazeboEndSwitch) {
			this.exitElevator1.goDown();
		} else
		if (switchObj === this.mazeSwitch) {
			this.exitElevator2.goDown();
		} else		
		if (switchObj === this.southEndSwitch) {
			this.exitElevator3.goDown();
		} else
		if (switchObj === this.southLeftSwitch) {
			this.southClosetDoor2.open();
			this.southRightSwitch.block();
			this.foundSecret();
		} else
		if (switchObj === this.southRightSwitch) {
			this.southClosetDoor1.open();
			this.southLeftSwitch.block();
		} else
		if (switchObj === this.endSwitch) {
			this.mapWon = true;
		}
	},
});