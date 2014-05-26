// https://github.com/mrdoob/three.js/blob/master/examples/js/shaders/ColorifyShader.js

GS.ColorShader = {
	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"color":    { type: "c", value: new THREE.Color(0xffffff) }
	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform vec3 color;",
		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D(tDiffuse, vUv);",

			"gl_FragColor = vec4(texel.xyz + color.xyz * 0.75, 1.0);",

		"}"

	].join("\n")
};
