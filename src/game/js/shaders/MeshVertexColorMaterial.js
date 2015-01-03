GS.MeshVertexColorMaterial = function() {
	this.shader = GS.VertexColorShader;

	this.uniforms = THREE.UniformsUtils.clone(this.shader.uniforms);

	THREE.ShaderMaterial.call(this, {
		uniforms: this.uniforms,
		attributes: {
			emissive: { type: "c", value: [] }
		},
		fragmentShader: this.shader.fragmentShader,
		vertexShader: this.shader.vertexShader,
		vertexColors: THREE.FaceColors,
		lights: true,
	});
};

GS.MeshVertexColorMaterial.prototype = GS.inherit(THREE.ShaderMaterial, {
	constructor: GS.MeshVertexColorMaterial,

	clone: function() {
		var material = new GS.MeshVertexColorMaterial();

		return material;
	},
});