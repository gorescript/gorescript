var gulp = require("gulp");
var uglify = require("gulp-uglify");
var concat = require("gulp-concat-util");
var insert = require("gulp-insert");

gulp.task("js-vendor", function () {
	return gulp.src([
			"./src/deps/jquery.min.js",
			"./src/deps/lodash.min.js",
			"./src/deps/jszip.min.js",
			"./src/deps/tween.min.js",
			"./src/deps/three.min.js",
			"./src/deps/OBJExporter.js",
			"./src/deps/OBJLoader.js",

			"./src/deps/post-processing/*.js",
		])

		.pipe(concat("gorescript-deps.min.js", { sep: ";" }))

		.pipe(insert.prepend([
				"/*! gorescript / http://gorescript.com */",
				"/*! three.js / threejs.org/license */",
				"/*! tween.js - http://github.com/sole/tween.js */",
			].join("\n")))

		.pipe(uglify({
			mangle: false,
			preserveComments: "license"
		}))

		.pipe(gulp.dest(global.distFolder));
});