var GS = {};
var assetPaths = {};

var fs = require("fs");
var archiver = require("archiver");

loadAssetManifest();
buildZip();

function loadAssetManifest() {
	var path = __dirname + "/../game/js/enums/Assets.js";
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

function buildZip() {
	var output = fs.createWriteStream(__dirname + "/assets.zip");
	var archive = archiver("zip");

	output.on("close", function() {
		console.log(archive.pointer() + " total bytes");
	});

	archive.on("error", function(err) {
		throw err;
	});

	archive.pipe(output);

	var basePath = __dirname + "/../game/assets/";

	for (var j in GS.AssetTypes) {		
		var key = GS.AssetTypes[j];
		var assetDict = GS.Assets[key];

		if (key !== GS.AssetTypes.CubeTexture) {
			for (var i in assetDict) {
				var path = assetPaths[key] + assetDict[i].filename;
				archive.append(fs.createReadStream(basePath + path), { name: path });
			}
		} else {
			for (var i in assetDict) {
				for (var j = 0; j < GS.CubeTextureNames.length; j++) {
					var path = assetPaths[key] + assetDict[i].filename + "/" + GS.CubeTextureNames[j] + GS.CubeTextureExtension;
					archive.append(fs.createReadStream(basePath + path), { name: path });
				}
			}
		}
	}

	archive.finalize();
}