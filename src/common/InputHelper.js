GS.InputHelper = {
	keyState: [],
	leftMouseDown: false,
	middleMouseDown: false,
	rightMouseDown: false,
	mouseX: 0,
	mouseY: 0,
	screenRatioX: 1,
	screenRatioY: 1,
	mouseWheelEvents: [],
	ctrl: false,
	shift: false,
	alt: false,
	pressedKeys: [],
	keysPressed: false,		

	init: function() {
		var that = this;

		// $(document).on("contextmenu", function(){
		// 	return false;
		// });

		$(document).keydown(function(e){
			that.keyState[e.keyCode] = true;
			that.ctrl = e.ctrlKey;
			that.alt = e.altKey;
			that.shift = e.shiftKey;

			e.stopPropagation();
			e.preventDefault();
			return false;
		});

		$(document).keyup(function(e){
			that.keyState[e.keyCode] = false;
			that.ctrl = e.ctrlKey;
			that.alt = e.altKey;
			that.shift = e.shiftKey;

			e.stopPropagation();
			e.preventDefault();
			return false;
		});

		$(document).mousedown(function(e){
			if (e.which == 1)
				that.leftMouseDown = true;
			if (e.which == 2)
				that.middleMouseDown = true;
			if (e.which == 3)
				that.rightMouseDown = true;
		});

		$(document).mouseup(function(e){
			if (e.which == 1)
				that.leftMouseDown = false;
			if (e.which == 2)
				that.middleMouseDown = false;
			if (e.which == 3)
				that.rightMouseDown = false;
		});

		$(document).mousemove(function(e){
			that.mouseX = e.pageX * that.screenRatioX;
			that.mouseY = e.pageY * that.screenRatioY;
		});

		document.addEventListener("mousewheel", function(e) {
			that.mouseWheelEvents.push(e.wheelDelta);
		}, false);

		document.addEventListener("DOMMouseScroll", function(e) {
			that.mouseWheelEvents.push(e.detail * -1);
		}, false);
	},

	isKeyUp: function(keyCode) {
		return !this.keyState[keyCode];
	},

	isKeyDown: function(keyCode, dontModifyPressed) {
		if (!dontModifyPressed) {
			if (this.keyState[keyCode]) {
				if (this.pressedKeys.indexOf(keyCode) == -1) {
					this.pressedKeys.push(keyCode);
				}
				this.keysPressed = true;
			}
		}
		return this.keyState[keyCode];
	},

	checkPressedKeys: function() {
		if (this.pressedKeys.length > 0) {
			var n = 0;
			for (var i = 0; i < this.pressedKeys.length; i++) {
				if (this.isKeyUp(this.pressedKeys[i])) {
					n++;
				}
				else {
					return;
				}
			}

			if (n == this.pressedKeys.length) {
				this.keysPressed = false;
			}
		}
	},
};

GS.InputHelper.init();