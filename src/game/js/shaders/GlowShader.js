GS.GlowShader = {
	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"tGlow": { type: "t", value: null },
		"intensity":  { type: "f", value: 1.0 }
	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform float intensity;",
		"uniform sampler2D tDiffuse;",
		"uniform sampler2D tGlow;",
		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D(tDiffuse, vUv);",
			"vec4 glow = texture2D(tGlow, vUv);",

			"gl_FragColor = vec4(texel.xyz + glow.xyz * intensity, 1.0);",

		"}"

	].join("\n")
};
