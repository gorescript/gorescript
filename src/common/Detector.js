GS.Detector = {
	run: function(callback) {
		var canvas = document.createElement("canvas");
		if (canvas.getContext === undefined) {
			this.displayErrorMessage("HTML5 canvas");
			return;
		}

		var webGL = (function () {
			try {
				var canvas = document.createElement("canvas");
				return !!window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
			} catch (e) {
				return false;
			}
		})();
		if (!webGL) {
			this.displayErrorMessage("WebGL, or WebGL failed to initialize");
			return;
		}

		var webAudio = (typeof AudioContext !== "undefined") || (typeof webkitAudioContext !== "undefined");
		if (!webAudio) {
			this.displayErrorMessage("the Web Audio API");
			return;
		}

		var pointerLock = "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;
		if (!pointerLock) {
			this.displayErrorMessage("the Pointer Lock API");
			return;
		}

		// @if TARGET='WEB'
		var localStorage;
		try {
			localStorage = "localStorage" in window && window["localStorage"] !== null;
		} catch(e) {
			localStorage = false;
		}
		if (!localStorage) {
			this.displayErrorMessage("HTML5 local storage");
			return;
		}
		// @endif

		callback();
	},

	displayErrorMessage: function(html) {
		var div = document.createElement("div");

		div.style.width = "450px";
		div.style.height = "150px";
		div.style.marginLeft = "-225px";
		div.style.marginTop = "-75px";
		div.style.position = "absolute";
		div.style.top = "50%";
		div.style.left = "50%";
		div.style.backgroundColor = "#000";
		div.style.color = "#fff";
		div.style.fontSize = "20px";
		div.style.fontFamily = "Arial, Helvetica, sans-serif";
		div.style.fontWeight = "normal";
		div.style.textAlign = "center";
		div.style.border = "1px dashed #fff";

		var span = document.createElement("span");
		span.style.display = "block";
		span.style.marginTop = "50px";
		span.innerHTML = "Your browser does not support<br/>" + html + ".";

		div.appendChild(span);
		document.body.appendChild(div);
	}
};