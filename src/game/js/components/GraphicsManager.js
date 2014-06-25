GS.GraphicsManager = function(renderer, camera) {
	this.renderer = renderer;
	this.camera = camera;

	this.noPostProcessing = false;
	this.noiseTextureSize = 256;

	this.showWeapon = GS.Settings.showWeapon;
};

GS.GraphicsManager.prototype = {
	init: function() {
		this.initEffectComposer();

		this.bloomEnabled = GS.Settings.bloom;
		this.fxaaEnabled = GS.Settings.fxaa;
		this.ssaoEnabled = GS.Settings.ssao;
		this.noiseEnabled = GS.Settings.noise;
		this.vignetteEnabled = GS.Settings.vignette;		
		this.halfSizeEnabled = GS.Settings.halfSize;

		this.monochromeEnabled = false;
	},

	setGrid: function(grid) {
		var that = this;

		this.grid = grid;
		this.scene = grid.scene;

		that.effectColor.uniforms["color"].value.setRGB(0, 0, 0);
		grid.player.playerView.addEventListener("screenOverlayColorChange", function(e) {
			that.effectColor.uniforms["color"].value.copy(e.color);
		});
	},

	initEffectComposer: function() {
		this.composer = new THREE.EffectComposer(this.renderer);

		var depthShader = THREE.ShaderLib["depthRGBA"];
		var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);

		this.depthMaterial = new THREE.ShaderMaterial({ 
			fragmentShader: depthShader.fragmentShader, 
			vertexShader: depthShader.vertexShader, 
			uniforms: depthUniforms 
		});
		this.depthMaterial.blending = THREE.NoBlending;

		this.depthTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { 
			minFilter: THREE.NearestFilter, 
			magFilter: THREE.NearestFilter, 
			format: THREE.RGBAFormat 
		});

		this.effectSSAO = new THREE.ShaderPass(THREE.SSAOShader);
		this.effectSSAO.uniforms["tDepth"].value = this.depthTarget;
		this.effectSSAO.uniforms["size"].value.set(window.innerWidth, window.innerHeight);
		this.effectSSAO.uniforms["cameraNear"].value = this.camera.near;
		this.effectSSAO.uniforms["cameraFar"].value = this.camera.far;

		this.effectFilter = new THREE.ShaderPass(GS.BrightnessFilterShader);
		this.effectBloom = new THREE.BloomPass(1, 25, 4, 512);
		this.effectBloom.needsSwap = true;

		this.effectGlow = new THREE.ShaderPass(GS.GlowShader);
		this.effectGlow.uniforms["tGlow"].value = this.effectBloom.renderTargetY;
		this.effectGlow.uniforms["intensity"].value = 1;

		this.effectColor = new THREE.ShaderPass(GS.ColorShader);
		this.effectColor.uniforms["color"].value = new THREE.Color(0x000000);

		this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
		this.effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);

		this.effectVignette = new THREE.ShaderPass(THREE.VignetteShader);
		this.effectNoise = new THREE.ShaderPass(GS.NoiseShader);
		this.effectNoise.uniforms["tNoise"].value = this.getNoiseTexture(this.noiseTextureSize);
		this.effectNoise.uniforms["ratio"].value.set(window.innerWidth / this.noiseTextureSize, window.innerHeight / this.noiseTextureSize);

		this.effectMonochrome = new THREE.ShaderPass(THREE.LuminosityShader);

		var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
		effectCopy.renderToScreen = true;

		this.composer.addPass(this.effectFilter);
		this.composer.addPass(this.effectBloom);
		this.composer.addPass(this.effectNoise);
		this.composer.addPass(this.effectGlow);
		this.composer.addPass(this.effectSSAO);
		this.composer.addPass(this.effectColor);
		this.composer.addPass(this.effectFXAA);
		this.composer.addPass(this.effectVignette);		
		this.composer.addPass(this.effectMonochrome);
		this.composer.addPass(effectCopy);
	},

	renderToScreen: function() {
		this.renderer.autoClear = false;

		this.renderer.clear(true, true, false);

		this.renderer.render(this.grid.skybox.scene, this.grid.skybox.camera);
		this.renderer.render(this.scene, this.camera);

		this.renderer.clear(false, true, false);

		var playerView = this.grid.player.playerView;
		this.renderer.render(playerView.scene, playerView.camera);
	},

	render: function() {
		var renderTarget = this.composer.renderTarget2;
		this.renderer.autoClear = false;

		this.renderer.clearTarget(renderTarget, true, true, false);

		this.renderer.render(this.grid.skybox.scene, this.grid.skybox.camera, renderTarget);
		this.renderer.render(this.scene, this.camera, renderTarget);

		this.renderer.clearTarget(renderTarget, false, true, false);

		if (this.showWeapon) {
			var playerView = this.grid.player.playerView;
			this.renderer.render(playerView.scene, playerView.camera, renderTarget);
		}
	},

	renderDepthTarget: function() {
		var renderTarget = this.depthTarget;
		this.renderer.autoClear = false;

		this.renderer.clearTarget(renderTarget, true, true, false);

		this.scene.overrideMaterial = this.depthMaterial;
		this.renderer.render(this.scene, this.camera, renderTarget);
		this.scene.overrideMaterial = null;

		this.renderer.clearTarget(renderTarget, false, true, false);

		if (this.showWeapon) {
			var playerView = this.grid.player.playerView;
			playerView.scene.overrideMaterial = this.depthMaterial;
			this.renderer.render(playerView.scene, playerView.camera, renderTarget);
			playerView.scene.overrideMaterial = null;
		}
	},

	draw: function() {
		if (this.noPostProcessing) {
			this.renderToScreen();
		} else {			
			this.render();

			if (this.ssaoEnabled) {
				this.renderDepthTarget();
			}

			this.composer.render();
		}
	},

	onResize: function() {
		var width = window.innerWidth;
		var height = window.innerHeight;

		if (this._halfSizeEnabled) {
			width *= 0.5;
			height *= 0.5;
		}

		var depthTarget = this.depthTarget.clone();
		depthTarget.width = width;
		depthTarget.height = height;
		this.depthTarget = depthTarget;
		this.effectSSAO.uniforms["tDepth"].value = this.depthTarget;

		this.effectSSAO.uniforms["size"].value.set(width, height);
		this.effectFXAA.uniforms["resolution"].value.set(1 / width, 1 / height);
		this.effectNoise.uniforms["ratio"].value.set(width / this.noiseTextureSize, height / this.noiseTextureSize);
		this.composer.setSize(width, height);

		$(this.renderer.domElement).css("width", window.innerWidth + "px").css("height", window.innerHeight + "px");
	},

	getNoiseTexture: function(size) {
		size = size || 256;

		var canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		canvas.style.backgroundColor = "rgba(255, 255, 255, 1)";

		var ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		ctx.save();

		var imageData = ctx.getImageData(0, 0, size, size);
		for (var i = 0, n = size * size * 4; i < n; i += 4) {
			var x = Math.floor(Math.random() * 255);
			imageData.data[i] = x;
			imageData.data[i + 1] = x;
			imageData.data[i + 2] = x;
			imageData.data[i + 3] = 255;
		}

		ctx.putImageData(imageData, 0, 0);

		var tex = new THREE.Texture(canvas);
		tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
		tex.needsUpdate = true;
		return tex;
	},

	reset: function() {
		this.grid = undefined;
		this.scene = undefined;
	},

	set ssaoEnabled(value) {
		if (this.effectSSAO !== undefined) {
			this.effectSSAO.enabled = value;
		}
	},

	get ssaoEnabled() {
		return this.effectSSAO.enabled;
	},

	set bloomEnabled(value) {
		if (this.effectBloom !== undefined) {
			this.effectFilter.enabled = value;
			this.effectBloom.enabled = value;
			this.effectGlow.enabled = value;
		}
	},

	get bloomEnabled() {
		return this.effectBloom.enabled;
	},

	set fxaaEnabled(value) {
		if (this.effectFXAA !== undefined) {
			this.effectFXAA.enabled = value;
		}
	},

	get fxaaEnabled() {
		return this.effectFXAA.enabled;
	},

	set vignetteEnabled(value) {
		if (this.effectVignette !== undefined) {
			this.effectVignette.enabled = value;
		}
	},

	get vignetteEnabled() {
		return this.effectVignette.enabled;
	},

	set monochromeEnabled(value) {
		if (this.effectMonochrome !== undefined) {
			this.effectMonochrome.enabled = value;
		}
	},

	get monochromeEnabled() {
		return this.effectMonochrome.enabled;
	},

	set noiseEnabled(value) {
		if (this.effectNoise !== undefined) {
			this.effectNoise.enabled = value;
		}
	},

	get noiseEnabled() {
		return this.effectNoise.enabled;
	},

	set halfSizeEnabled(value) {		
		this._halfSizeEnabled = value;
		this.onResize();
	},

	get halfSizeEnabled() {
		return this._halfSizeEnabled;
	},
};