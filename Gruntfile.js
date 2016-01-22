var generateAssetsZip = require("./grunt-config/generateAssetsZip");

module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		uglify: {
			options: {
				separator: ";",
				preserveComments: "some",
				banner: [
					"/*! gorescript / http://gorescript.com */", "",
					"/*! three.js / threejs.org/license */",
					"/*! tween.js - http://github.com/sole/tween.js */", "", "",
				].join("\n")
			},
			build: {
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

						dest: "build/gorescript-deps.min.js"
					},
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
							"src/game/js/factories/*.js",
							"src/game/js/components/*.js",
							"src/game/js/views/*.js",

							"src/game/js/*.js",
						],

						dest: "build/gorescript.min.js"
					}
				]
			}
		},

		copy: {
			main: {
				files: [
					{ src: "src/game/index_build.html", dest: "build/index.html" },
					{ src: "src/game/assets/fonts/capsuula.woff", dest: "build/capsuula.woff" }
				]
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");

	grunt.registerTask("generate-assets-zip", "generate-assets-zip", function() {
		var done = this.async();

		generateAssetsZip(done);
	});

	grunt.registerTask("default", ["uglify", "copy", "generate-assets-zip"]);

};
