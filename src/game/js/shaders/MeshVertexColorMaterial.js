GS.MeshVertexColorMaterial = function(emissive) {
	this.shader = GS.VertexColorShader;

	this.uniforms = THREE.UniformsUtils.clone(this.shader.uniforms);

	this.uniforms["emissive"].value = new THREE.Color(emissive || 0);

	THREE.ShaderMaterial.call(this, {
		uniforms: this.uniforms,
		fragmentShader: this.shader.fragmentShader,
		vertexShader: this.shader.vertexShader,
		vertexColors: THREE.FaceColors,
		lights: true,
	});
};

GS.MeshVertexColorMaterial.prototype = GS.inherit(THREE.ShaderMaterial, {
	constructor: GS.MeshVertexColorMaterial,

	clone: function() {
		var material = new GS.MeshVertexColorMaterial(
			this.uniforms["emissive"].value
		);

		return material;
	},

	get emissive() {
		return this.uniforms["emissive"].value;
	},
});