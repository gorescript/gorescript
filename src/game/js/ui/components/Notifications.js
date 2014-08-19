GS.UIComponents.Notifications = function(vectorCanvas, assets, player) {
	this.cvs = vectorCanvas;
	this.assets = assets;
	this.player = player;

	this.fontSize = 40;
	this.boxCornerRadius = 10;

	this.useText = "[" + GS.Keybinds.use.controlName + "] to use";
	this.pointerLockText = "right-click to enable pointer lock";
	this.restartText = "[ENTER] to restart level";

	this.usePopup = {
		originalOffset: new THREE.Vector2(0, 100),
		offset: new THREE.Vector2(),
		pos: new THREE.Vector2(0.5, 0.5),
		size: new THREE.Vector2(0, 60),
		textOffset: new THREE.Vector2(0, 0),
	};

	this.pointerLockPopup = {
		originalOffset: new THREE.Vector2(0, 100),
		offset: new THREE.Vector2(),
		pos: new THREE.Vector2(0.5, 0.5),
		size: new THREE.Vector2(0, 60),
		textOffset: new THREE.Vector2(0, 0),
	};

	this.restartPopup = {
		originalOffset: new THREE.Vector2(0, 100),
		offset: new THREE.Vector2(),
		pos: new THREE.Vector2(0.5, 0.5),
		size: new THREE.Vector2(0, 60),
		textOffset: new THREE.Vector2(0, 0),
	};

	this.calculateSizes();

	this.visible = true;

	this.oldShowUsePopup = false;
	this.showUsePopup = false;

	this.oldShowPointerLockPopup = false;
	this.showPointerLockPopup = false;

	this.oldShowRestartPopup = false;
	this.showRestartPopup = false;
};

GS.UIComponents.Notifications.prototype = {
	constructor: GS.UIComponents.Notifications,

	init: function() {
	},

	update: function() {
		this.showUsePopup = this.player.canUse;
		if (this.showUsePopup != this.oldShowUsePopup) {
			this.needsRedraw = true;
			this.oldShowUsePopup = this.showUsePopup;
		}

		this.showPointerLockPopup = !this.player.controls.pointerLockEnabled;
		if (this.showPointerLockPopup != this.oldShowPointerLockPopup) {
			this.needsRedraw = true;
			this.oldShowPointerLockPopup = this.showPointerLockPopup;
		}

		this.showRestartPopup = this.player.dead;
		if (this.showRestartPopup != this.oldShowRestartPopup) {
			this.needsRedraw = true;
			this.oldShowRestartPopup = this.showRestartPopup;
		}
	},

	draw: function() {
		if (this.showRestartPopup) {
			this.drawPopup(this.restartText, this.restartPopup);
		} else
		if (this.showPointerLockPopup) {
			this.drawPopup(this.pointerLockText, this.pointerLockPopup);
		} else
		if (this.showUsePopup) {
			this.drawPopup(this.useText, this.usePopup);
		}
	},

	drawPopup: function(text, popup) {
		this.cvs.roundedBoxFill(popup.offset, popup.pos, popup.size, true, 
			this.boxCornerRadius, GS.UIColors.background);
		this.cvs.text(popup.textOffset, popup.pos, text, 
			GS.UIColors.foreground, this.fontSize, "middle", "center", GS.UIFont);
	},

	calculateSizes: function() {		
		this.calculatePopupSize(this.useText, this.usePopup);
		this.calculatePopupSize(this.pointerLockText, this.pointerLockPopup);
		this.calculatePopupSize(this.restartText, this.restartPopup);
	},

	calculatePopupSize: function(text, popup, textWidth) {
		if (textWidth === undefined) {
			textWidth = this.cvs.getTextWidth(text, this.fontSize, GS.UIFont);
		}

		var padding = 15;
		var width = textWidth + padding * 2;

		popup.size.x = width;
		popup.offset.x = -width / 2;
		popup.offset.y = popup.originalOffset.y - popup.size.y;
		popup.textOffset.copy(popup.offset).add(popup.size.clone().multiplyScalar(0.5));
	},
};