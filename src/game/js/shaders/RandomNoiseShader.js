GS.RandomNoiseShader = {
	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"intensity" : { type: "f", value: 0.05 },
		"seed": { type: "v2", value: new THREE.Vector2(Math.random(), Math.random()) },
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
		"uniform float intensity;",
		"uniform vec2 seed;",

		"varying vec2 vUv;",

		// http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/

		"highp float rand(vec2 co)",
		"{",
			"highp float a = 12.9898;",
			"highp float b = 78.233;",
			"highp float c = 43758.5453;",
			"highp float dt = dot(co.xy, vec2(a,b));",
			"highp float sn = mod(dt, 3.14);",
			"return fract(sin(sn) * c);",
		"}",

		"void main() {",

			"vec4 cDiffuse = texture2D(tDiffuse, vUv);",
			"gl_FragColor = vec4(cDiffuse.xyz - rand(vUv + seed) * intensity, 1.0);",

		"}"

	].join("\n")
};
