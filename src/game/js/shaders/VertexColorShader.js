GS.VertexColorShader = {

	uniforms: THREE.UniformsUtils.merge( [

		THREE.UniformsLib[ "common" ],
		THREE.UniformsLib[ "normalmap" ],
		THREE.UniformsLib[ "fog" ],
		THREE.UniformsLib[ "lights" ],

		{
			"ambient"  : { type: "c", value: new THREE.Color( 0xffffff ) },
			"specular" : { type: "c", value: new THREE.Color( 0x111111 ) },
			"shininess": { type: "f", value: 30 },
			"wrapRGB"  : { type: "v3", value: new THREE.Vector3( 1, 1, 1 ) }
		}

	] ),

	vertexShader: [

		"#define PHONG",

		"varying vec3 vViewPosition;",
		"varying vec3 vNormal;",

		THREE.ShaderChunk[ "lights_phong_pars_vertex" ],

		"#ifdef USE_COLOR",
			"attribute vec3 emissive;",

			"varying vec3 vColor;",
			"varying vec3 vEmissive;",
		"#endif",

		"void main() {",

			"#ifdef USE_COLOR",
				"#ifdef GAMMA_INPUT",
					"vColor = color * color;",
				"#else",
					"vColor = color;",
				"#endif",

				"vEmissive = emissive;",
			"#endif",

			THREE.ShaderChunk[ "defaultnormal_vertex" ],

			"vNormal = normalize( transformedNormal );",

			THREE.ShaderChunk[ "default_vertex" ],

			"vViewPosition = -mvPosition.xyz;",

			THREE.ShaderChunk[ "worldpos_vertex" ],
			THREE.ShaderChunk[ "lights_phong_vertex" ],

		"}"

	].join("\n"),

	fragmentShader: [

		"#define PHONG",

		"uniform vec3 diffuse;",
		"uniform float opacity;",

		"uniform vec3 ambient;",
		"uniform vec3 specular;",
		"uniform float shininess;",

		"#ifdef USE_COLOR",
			"varying vec3 vColor;",
			"varying vec3 vEmissive;",
		"#endif",

		THREE.ShaderChunk[ "fog_pars_fragment" ],
		THREE.ShaderChunk[ "lights_phong_pars_fragment" ],
		THREE.ShaderChunk[ "normalmap_pars_fragment" ],
		THREE.ShaderChunk[ "specularmap_pars_fragment" ],

		"void main() {",

			"gl_FragColor = vec4( vec3( 1.0 ), opacity );",

			THREE.ShaderChunk[ "specularmap_fragment" ],

			"vec3 emissive = vEmissive;",

			THREE.ShaderChunk[ "lights_phong_fragment" ],
			THREE.ShaderChunk[ "color_fragment" ],

			THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
			THREE.ShaderChunk[ "fog_fragment" ],

		"}"

	].join("\n")

};