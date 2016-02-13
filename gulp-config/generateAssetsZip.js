var gulp = require("gulp");
var fs = require("fs");
var archiver = require("archiver");

var GS = {};
var assetPaths = {};

gulp.task("generateAssetsZip", function (cb) {
	run(cb);
});

function run(done) {
	loadAssetManifest();
	buildZip(done);
}

function loadAssetManifest() {
	var path = "./src/game/js/enums/Assets.js";
	var data = fs.readFileSync(path, "utf8");

	eval(data);

	assetPaths[GS.AssetTypes.Texture] = "textures/";
	assetPaths[GS.AssetTypes.CubeTexture] = "textures/";
	assetPaths[GS.AssetTypes.UIWidget] = "textures/widgets/";
	assetPaths[GS.AssetTypes.Mesh] = "meshes/";
	assetPaths[GS.AssetTypes.Sound] = "sounds/";
	assetPaths[GS.AssetTypes.Map] = "maps/";
	assetPaths[GS.AssetTypes.Script] = "scripts/";
	assetPaths[GS.AssetTypes.MusicTrack] = "music/";
}

function buildZip(done) {
	var output = fs.createWriteStream(global.distFolder + "/assets.zip");

	output.on("close", function() {
		console.log(archive.pointer() + " total bytes");
		done();
	});

	var archive = archiver("zip");

	archive.on("error", function(err) {
		throw err;
	});

	archive.pipe(output);

	var basePath = "./src/game/assets/";

	Object.keys(GS.AssetTypes).forEach(function(j) {
		var key = GS.AssetTypes[j];
		var assetDict = GS.Assets[key];

		if (key !== GS.AssetTypes.CubeTexture) {
			Object.keys(assetDict).forEach(function(i) {
				if (assetDict[i].filename === "") {
					return;
				}

				var path = assetPaths[key] + assetDict[i].filename;
				archive.append(fs.createReadStream(basePath + path), { name: path });
			});
		} else {
			Object.keys(assetDict).forEach(function(i) {
				GS.CubeTextureNames.forEach(function(cubeTextureName) {
					var path = assetPaths[key] + assetDict[i].filename + "/" + cubeTextureName + GS.CubeTextureExtension;
					archive.append(fs.createReadStream(basePath + path), { name: path });
				});
			});
		}
	});

	archive.finalize();
}