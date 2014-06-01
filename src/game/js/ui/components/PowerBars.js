GS.UIComponents.PowerBars = function(vectorCanvas, assets, player) {
	this.cvs = vectorCanvas;
	this.assets = assets;
	this.player = player;

	this.fontSize = 60;
	this.boxCornerRadius = 10;

	this.healthBar = {
		offset: new THREE.Vector2(20, -20),
		pos: new THREE.Vector2(0, 1),
		size: new THREE.Vector2(220, 90),
		textOffset: new THREE.Vector2(95, 4),
		imageOffset: new THREE.Vector2(20, 20),
		imageAtlasOffset: new THREE.Vector2(0, 0),
		imageAtlasSize: new THREE.Vector2(64, 64),
	};

	this.healthBar.offset.y -= this.healthBar.size.y;
	this.healthBar.imageOffset.add(this.healthBar.offset);
	this.healthBar.textOffset.add(this.healthBar.offset).add(this.healthBar.size.clone().multiplyScalar(0.5));	

	this.ammoBar = {
		offset: new THREE.Vector2(-20, -20),
		pos: new THREE.Vector2(1, 1),
		size: new THREE.Vector2(220, 90),
		textOffset: new THREE.Vector2(95, 4),
		imageOffset: new THREE.Vector2(20, 20),
		imageAtlasOffset: new THREE.Vector2(64, 0),
		imageAtlasSize: new THREE.Vector2(64, 64),
	};

	this.ammoBar.offset.sub(this.ammoBar.size);
	this.ammoBar.imageOffset.add(this.ammoBar.offset);
	this.ammoBar.textOffset.add(this.ammoBar.offset).add(this.ammoBar.size.clone().multiplyScalar(0.5));

	this.tex = this.assets.images.hud;

	this.visible = true;

	this.ammo = undefined;
	this.health = "";
	this.oldHealth = -1;
	this.oldAmmo = -1;
};

GS.UIComponents.PowerBars.prototype = {
	constructor: GS.UIComponents.PowerBars,

	init: function() {
	},

	update: function() {
		this.health = Math.floor(this.player.health);
		if (this.player.weapon !== undefined && !this.player.weapon.infiniteAmmo) {
			this.ammo = this.player.weapon.ammo;
		} else {
			this.ammo = undefined;
		}

		if (this.health != this.oldHealth || this.ammo != this.oldAmmo) {
			this.needsRedraw = true;
			this.oldHealth = this.health;
			this.oldAmmo = this.ammo;
		}
	},

	draw: function() {
		this.cvs.roundedBoxFill(this.healthBar.offset, this.healthBar.pos, this.healthBar.size, true, 
				this.boxCornerRadius, GS.UIColors.background);
		this.cvs.text(this.healthBar.textOffset, this.healthBar.pos, this.health, 
			GS.UIColors.foreground, this.fontSize, "middle", "right", GS.UIFont);

		this.cvs.drawImageFromAtlas(this.healthBar.imageOffset, this.healthBar.pos, this.tex,
			this.healthBar.imageAtlasOffset, this.healthBar.imageAtlasSize);

		if (this.ammo !== undefined) {
			this.cvs.roundedBoxFill(this.ammoBar.offset, this.ammoBar.pos, this.ammoBar.size, true, 
					this.boxCornerRadius, GS.UIColors.background);
			this.cvs.text(this.ammoBar.textOffset, this.ammoBar.pos, this.ammo, GS.UIColors.foreground, 
				this.fontSize, "middle", "right", GS.UIFont);
			this.cvs.drawImageFromAtlas(this.ammoBar.imageOffset, this.ammoBar.pos, this.tex,
				this.ammoBar.imageAtlasOffset, this.ammoBar.imageAtlasSize);
		}
	},
};