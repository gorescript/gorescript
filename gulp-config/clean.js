var gulp = require("gulp");
var del = require("del");

gulp.task("clean", function (cb) {
	if (global.target === "WEB") {
		return del([global.distFolder + "/**/*"]);
	} else
	if (global.target === "CHROME_APP") {
		return del([
			global.distFolder + "/app.zip",
			global.distFolder + "/assets.zip",
			global.distFolder + "/capsuula.woff",
			global.distFolder + "/gorescript-deps.min.js",
			global.distFolder + "/gorescript.min.js",
			global.distFolder + "/index.html"
		]);
	} else
	if (global.target === "DESKTOP") {
		return del([
			global.distFolder + "/assets.zip",
			global.distFolder + "/capsuula.woff",
			global.distFolder + "/gorescript-deps.min.js",
			global.distFolder + "/gorescript.min.js",
			global.distFolder + "/index.html"
		]);
	}
});