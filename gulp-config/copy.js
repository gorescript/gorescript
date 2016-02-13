var gulp = require("gulp");
var preprocess = require("gulp-preprocess");

gulp.task("copy-html", function () {
	return gulp.src([
			"./src/game/index.html",
		])
		.pipe(preprocess({ context: { TARGET: global.target }}))
		.pipe(gulp.dest(global.distFolder));
});

gulp.task("copy", ["copy-html"], function () {
	return gulp.src([
			"./src/game/assets/fonts/capsuula.woff"
		])
		.pipe(gulp.dest(global.distFolder));
});