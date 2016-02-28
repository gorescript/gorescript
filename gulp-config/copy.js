var gulp = require("gulp");
var preprocess = require("gulp-preprocess");

gulp.task("copy-html", function () {
	var files = [
		"./src/game/index.html"
	];

	if (global.target === "DESKTOP") {
		files.push("./src/game/main.js");
	}

	return gulp.src(files)
		.pipe(preprocess({ context: { TARGET: global.target, DEBUG: !global.production }}))
		.pipe(gulp.dest(global.distFolder));
});

gulp.task("copy", ["copy-html"], function () {
	return gulp.src([
			"./src/game/assets/fonts/capsuula.woff"
		])
		.pipe(gulp.dest(global.distFolder));
});