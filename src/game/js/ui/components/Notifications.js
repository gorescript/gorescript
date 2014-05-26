GS.UIComponents.Notifications = function(vectorCanvas, assets, player) {
	this.cvs = vectorCanvas;
	this.assets = assets;
	this.player = player;

	this.fontSize = 40;
	this.boxCornerRadius = 10;

	this.useText = "[E] use";
	this.pointerLockText = "right-click to enable pointer lock";

	this.usePopup = {
		offset: new THREE.Vector2(0, 100),
		pos: new THREE.Vector2(0.5, 0.5),
		size: new THREE.Vector2(0, 60),
		textOffset: new THREE.Vector2(0, 0),
	};

	this.pointerLockPopup = {
		offset: new THREE.Vector2(0, 100),
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

		this.showPointerLockPopup = (!this.player.inMenu && !this.player.controls.pointerLockEnabled);
		if (this.showPointerLockPopup != this.oldShowPointerLockPopup) {
			this.needsRedraw = true;
			this.oldShowPointerLockPopup = this.showPointerLockPopup;
		}
	},

	draw: function() {
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
	},

	calculatePopupSize: function(text, popup, textWidth) {
		if (textWidth === undefined) {
			textWidth = this.cvs.getTextWidth(text, this.fontSize, GS.UIFont);
		}

		var padding = 15;
		var width = textWidth + padding * 2;

		popup.offset.x = -width / 2;
		popup.size.x = width;
		popup.offset.y -= popup.size.y;
		popup.textOffset.copy(popup.offset).add(popup.size.clone().multiplyScalar(0.5));
	},
};