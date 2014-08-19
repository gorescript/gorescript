GS.KeybindSettings = {
	keybinds: [
		{
			actionName: "moveForward",
			controlName: "W",
			code: 87
		},
		{
			actionName: "moveBackward",
			controlName: "S",
			code: 83
		},
		{
			actionName: "strafeLeft",
			controlName: "A",
			code: 65
		},
		{
			actionName: "strafeRight",
			controlName: "D",
			code: 68
		},
		{
			actionName: "use",
			controlName: "E",
			code: 69
		},
		{
			actionName: "shoot",
			controlName: "MOUSE LEFT",
			mouse: true,
			button: 1
		},
		{
			actionName: "pistol",
			controlName: "2",
			code: 50
		},
		{
			actionName: "shotgun",
			controlName: "3",
			code: 51
		},
		{
			actionName: "hyperblaster",
			controlName: "4",
			code: 52
		},
	],

	init: function() {
		this.rebound = new GS.Rebound(GS.KeybindSettings.keybinds);
		this.rebound.init();

		GS.Keybinds = {};

		for (var i = 0; i < this.keybinds.length; i++) {
			var keybind = this.keybinds[i];
			GS.Keybinds[keybind.actionName] = keybind;
		}
	},
};