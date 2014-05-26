GS.MeshPhongGlowMaterial = function(map, glow, normal, emissive, glowIntensity) {
	this.shader = GS.PhongGlowShader;

	this.uniforms = THREE.UniformsUtils.clone(this.shader.uniforms);

	this.uniforms["map"].value = map;
	this.uniforms["glowMap"].value = glow;
	this.uniforms["normalMap"].value = normal;
	this.uniforms["emissive"].value = new THREE.Color(emissive || 0);
	this.uniforms["glowIntensity"].value = (glowIntensity !== undefined) ? glowIntensity : 1;

	THREE.ShaderMaterial.call(this, {
		uniforms: this.uniforms,
		fragmentShader: this.shader.fragmentShader,
		vertexShader: this.shader.vertexShader,
		lights: true,
	});

	this.map = true;
	this.normalMap = (normal !== undefined && normal !== null);
};

GS.MeshPhongGlowMaterial.prototype = GS.inherit(THREE.ShaderMaterial, {
	constructor: GS.MeshPhongGlowMaterial,

	clone: function() {
		var material = new GS.MeshPhongGlowMaterial(
			this.uniforms["map"].value,
			this.uniforms["glowMap"].value,
			this.uniforms["normalMap"].value,			
			this.uniforms["emissive"].value,
			this.uniforms["glowIntensity"].value
		);

		return material;
	},

	get emissive() {
		return this.uniforms["emissive"].value;
	},

	set glowIntensity(value) {
		this.uniforms["glowIntensity"].value = value;
	},

	get glowIntensity() {
		return this.uniforms["glowIntensity"].value
	},
});