GS.TVStation = function(textures, maxAnisotropy) {
	this.textures = textures;
	this.anisotropy = maxAnisotropy;

	this.tvScreens = [];
};

GS.TVStation.prototype = {
	init: function() {
		this.initTexture();
		// this.initVideo();
	},

	initTexture: function() {
		this.texture = this.textures.tv;
		// THREE.ImageUtils.crossOrigin = true;

		this.texture.flipY = false;
		this.texture.anisotropy = this.anisotropy;

		this.initMaterial();

		this.material.transparent = true;
	},

	initVideo: function() {
		var video = document.createElement("video");
		video.autoplay = true;
		video.loop = true;
		video.muted = true;
		video.style.display = "none";
		video.src = "assets/textures/video.webm";
		video.type = "video/webm";
		this.video = video;

		this.texture = new THREE.Texture(video);
		this.texture.flipY = false;
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;
		this.texture.anisotropy = this.anisotropy;

		this.initMaterial();
		// this.material.opacity = 0.5;
		this.material.transparent = true;
		this.material.blending = THREE.AdditiveBlending;
	},

	initMaterial: function() {
		this.material = new THREE.MeshBasicMaterial({ 
			map: this.texture,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -4,
		});
	},

	getMaterial: function(tvScreen) {
		return this.material;
	},

	addTVScreen: function(tvScreen) {
		this.tvScreens.push(tvScreen);
	},

	update: function() {
	},

	draw: function() {
		if (this.video !== undefined && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
			this.texture.needsUpdate = true;
		}
	},
};