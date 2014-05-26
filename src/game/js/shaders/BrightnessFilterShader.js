GS.BrightnessFilterShader = {
	uniforms: {
		"tDiffuse": { type: "t", value: null },
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

		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D(tDiffuse, vUv);",

			"float lum = dot(texel, vec4(0.299, 0.587, 0.114, 0.0));",
			"lum = step(0.9999, lum);",

			"gl_FragColor = vec4(texel.xyz * lum, 1.0);",

		"}"

	].join("\n")
};
