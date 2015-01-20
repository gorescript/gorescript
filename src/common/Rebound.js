GS.Rebound = function(keybinds) {
	this.keybinds = keybinds;

	this.modifyingKeybind = false;

	this.onModifyingKeybindStart = function() {};
	this.onModifyingKeybindStop = function() {};
}

GS.Rebound.prototype = {
	init: function() {
		var that = this;

		$(document).on("keydown.keybindUse", function(e) {
			if (that.modifyingKeybind) {
				return;
			}

			var keybind = _.find(that.keybinds, { code: e.keyCode });
			if (keybind) {
				keybind.inUse = true;
				e.preventDefault();
			}
		});

		$(document).on("keyup.keybindUse", function(e) {
			if (that.modifyingKeybind) {
				return;
			}

			var keybind = _.find(that.keybinds, { code: e.keyCode });
			if (keybind) {
				keybind.inUse = false;
				e.preventDefault();
			}
		});

		$(document).on("mousedown.keybindUse", function(e) {
			if (that.modifyingKeybind) {
				return;
			}

			var keybind = _.find(that.keybinds, { mouse: true, button: e.which });
			if (keybind) {
				keybind.inUse = true;
				e.preventDefault();
			}
		});

		$(document).on("mouseup.keybindUse", function(e) {
			if (that.modifyingKeybind) {
				return;
			}

			var keybind = _.find(that.keybinds, { mouse: true, button: e.which });
			if (keybind) {
				keybind.inUse = false;
				e.preventDefault();
			}
		});
	},

	getKeybindByActionName: function(actionName) {
		return _.find(this.keybinds, { actionName: actionName });
	},

	modifyKeybind: function(keybind) {
		var that = this;

		if (this.modifyingKeybind) {
			return;
		}

		this.modifyingKeybind = true;
		this.onModifyingKeybindStart({ keybind: keybind });

		$(document).on("keydown.modifyKeybind", function(e) {
			var code = e.keyCode || e.which;
			$(document).off("keydown.modifyKeybind");
			$(document).off("mousedown.modifyKeybind");

			var ok = that.changeKey(keybind, e);
			that.modifyingKeybind = false;
			that.onModifyingKeybindStop({ keybind: keybind, success: ok });

			e.preventDefault();
		});

		$(document).on("mousedown.modifyKeybind", function(e) {
			var code = e.keyCode || e.which;
			$(document).off("keydown.modifyKeybind");
			$(document).off("mousedown.modifyKeybind");

			var ok = that.changeMouse(keybind, e);
			that.modifyingKeybind = false;
			that.onModifyingKeybindStop({ keybind: keybind, success: ok });

			e.preventDefault();
		});
	},

	changeKey: function(keybind, e) {
		var name = this.isKeyAllowed(e);
		if (!name) {
			return false;
		}

		e.preventDefault();

		var code = e.keyCode;
		var existing = _.find(this.keybinds, { code: code });

		if (existing) {
			existing.code = undefined;
			existing.mouse = undefined;
			existing.button = undefined;
			existing.controlName = "NOT BOUND";
		}

		keybind.code = code;
		keybind.mouse = undefined;
		keybind.button = undefined;
		keybind.controlName = name;

		return true;
	},

	changeMouse: function(keybind, e) {
		var name;

		if (e.which === 1) {
			name = "MOUSE LEFT";
		} else
		if (e.which === 2) {
			name = "MOUSE MIDDLE";
		} 
		// else
		// if (e.which === 3) {
		// 	name = "MOUSE RIGHT";
		// }

		if (!name) {
			return false;
		}

		var existing = _.find(this.keybinds, { mouse: true, button: e.which });

		if (existing) {
			existing.code = undefined;
			existing.mouse = undefined;
			existing.button = undefined;
			existing.controlName = "NOT BOUND";
		}

		keybind.code = undefined;
		keybind.mouse = true;
		keybind.button = e.which;
		keybind.controlName = name;

		return true;
	},

	isKeyAllowed: function(e) {
		// A-Z, a-z
		if (e.keyCode >= 65 && e.keyCode <= 90) {
			return String.fromCharCode(e.keyCode);
		}

		// 0-9
		if (e.keyCode >= 48 && e.keyCode <= 57) {
			return String.fromCharCode(e.keyCode);
		}

		// arrows
		if (e.keyCode >= 37 && e.keyCode <= 40) {
			return e.originalEvent.keyIdentifier.toUpperCase();
		}

		// shift, control, alt
		if (e.keyCode >= 16 && e.keyCode <= 18) {
			return e.originalEvent.keyIdentifier.toUpperCase();
		}

		switch (e.keyCode) {
			case 32:
				return "SPACE";
			case 13:
				return "ENTER";
			// case 9:
			// 	return "TAB";
			case 8:
				return "BACKSPACE";
			case 91:
			case 93:
				return "COMMAND";
		}

		return false;
	}
};