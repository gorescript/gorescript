var gulp = require("gulp");
var runSequence = require("run-sequence");
var requireDir = require("require-dir");

requireDir("./gulp-config");

global.distFolder = "./dist";

gulp.task("default", function() {
	global.production = false;

	run();

	gulp.watch([
		"./src/game/index.html"
		], ["copy"]);

	gulp.watch(["./src/**/*.js"], ["js-client"]);
});

gulp.task("prod", function() {
	global.production = true;

	run();
});

function run() {
	runSequence("clean", "copy", "generateAssetsZip", "js-vendor", "js-client");
}