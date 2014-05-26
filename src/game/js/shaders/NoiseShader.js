GS.NoiseShader = {
	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"tNoise": { type: "t", value: null },
		"ratio": { type: "v2", value: new THREE.Vector2(1, 1) },
		"intensity" : { type: "f", value: 0.05 },
	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform sampler2D tDiffuse;",
		"uniform sampler2D tNoise;",
		"uniform vec2 ratio;",
		"uniform float intensity;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 cDiffuse = texture2D(tDiffuse, vUv);",
			"vec4 cNoise = texture2D(tNoise, vUv * ratio);",

			"gl_FragColor = vec4(cDiffuse.xyz + cNoise.xyz * intensity - intensity * 0.5, 1.0);",

		"}"

	].join("\n")
};
