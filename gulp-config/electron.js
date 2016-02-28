var gulp = require("gulp");
var packager = require("electron-packager");

var options = {
	arch: "all",
	dir: "./desktop",
	platform: "win32",
	overwrite: true,
	out: "./desktop-build",
	asar: true
};

gulp.task("electron", function (cb) {
	packager(options, cb);
});