module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		jshint: {
			all: [
				"src/game/js/**/*.js",
				"src/common/**/*.js",
				"src/map-editor/js/**/*.js",
				"src/voxel-editor/js/**/*.js",
			],
			watch: [
				"src/game/js/**/*.js",
				"src/common/**/*.js",
			],
			options: {
				jshintrc: true
			}
		},

		uglify: {			
			options: {
				beautify: true,
				mangle: false,
				separator: ";",
			},
			vendor: {
				files: [
					{
						src: [
							"src/deps/jquery.min.js",
							"src/deps/lodash.min.js",
							"src/deps/jszip.min.js",
							"src/deps/tween.min.js",
							"src/deps/three.min.js",
							"src/deps/OBJExporter.js",
							"src/deps/OBJLoader.js",

							"src/deps/post-processing/*.js",
						],

						dest: "app/gorescript-deps.min.js"
					},
				]
			},
			client: {
				files: [
					{
						src: [
							"src/game/js/BuildOverride.js",
							"src/common/Base.js",              
							"src/common/*.js",

							"src/game/js/ui/*.js",
							"src/game/js/ui/components/*.js",
							"src/game/js/helpers/*.js",
							"src/game/js/shaders/*.js",
							"src/game/js/enums/*.js",              
							"src/game/js/grid-objects/GridObject.js",
							"src/game/js/grid-objects/*.js",
							"src/game/js/loaders/*.js",
							"src/game/js/components/MapScript.js",
							"src/game/js/map-scripts/*.js",
							"src/game/js/factories/*.js",
							"src/game/js/components/*.js",
							"src/game/js/views/*.js",

							"src/game/js/*.js",
						],

						dest: "app/gorescript.min.js"
					}
				]
			}
		},

		watch: {
			js: {
				files: [
					"src/game/js/**/*.js",
					"src/common/**/*.js",
				],
				tasks: ["jshint:watch", "uglify:client"],
				options: {
					spawn: false
				}
			},
			copy: {
				files: ["src/game/index.html"],
				tasks: ["copy:watch"],
				options: {
					spawn: false
				}
			}
		},

		copy: {
			all: {
				files: [
					{ src: "src/game/index.html", dest: "app/index.html" },
					{ src: "src/game/assets/fonts/capsuula.woff", dest: "app/capsuula.woff" },
					{ src: "src/server/assets.zip", dest: "app/assets.zip" }
				]
			},
			watch: {
				files: [
					{ src: "src/game/index.html", dest: "app/index.html" },
				]
			}
		},

		shell: {
			generateAssetsZip: {
				command: "gen_assets_zip.sh",
				options: {
					stderr: false,
					execOptions: {
						cwd: "src/server"
					}
				}
			}
		},

		connect: {
			client: {
				options: {
					port: 9000,
					hostname: "localhost",
					base: "./",
					keepalive: true,
				}
			},
		},
	});

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-connect");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");

	grunt.registerTask("default", ["jshint:all", "shell", "uglify:vendor", "uglify:client", "copy:all"]);

};
