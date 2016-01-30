var gulp = require("gulp");

gulp.task("copy", function () {
	return gulp.src([
			"./src/game/index.html",
			"./src/game/assets/fonts/capsuula.woff"
		])
		.pipe(gulp.dest(global.distFolder));
});