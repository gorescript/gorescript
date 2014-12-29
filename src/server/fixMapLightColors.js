var _ = require("lodash");
var pngparse = require("pngparse");
var fs = require("fs");

getTextureColors(processMaps);

function processMaps(textureColors) {
	console.log("Processing maps...");

	var mapPath = "../game/assets/maps/";
	var maps = [
		"airstrip1",
		"drencrom",
		"sacrosanct"
	];

	for (var i = 0; i < maps.length; i++) {
		processMap(maps[i]);
	}

	console.log("%s maps processed.", maps.length);

	function processMap(name) {
		console.log("Processing '%s'...", name);

		var data = fs.readFileSync(mapPath + name + ".js", "utf8");
		var map = JSON.parse(data);

		processSegments();
		processSectors();

		fs.writeFileSync(mapPath + name + ".js", JSON.stringify(map));

		function processSegments() {
			var allSegs = map.layerObjects[0];
			var concreteSegs = _.where(allSegs, function(item) {
				// tv screen, switch
				return item.type !== 4 && item.type !== 5;
			});

			for (var i = 0; i < concreteSegs.length; i++) {
				var seg = concreteSegs[i];

				seg.lightColor = textureColors[seg.texId].color;
			}
		}

		function processSectors() {
			var sectors = map.layerObjects[2];

			for (var i = 0; i < sectors.length; i++) {
				var sector = sectors[i];
				var texId = sector.floorTexId || sector.ceilTexId;

				sector.lightColor = textureColors[texId].color;
			}
		}		
	};
}

function getTextureColors(callback) {
	console.log("Loading texture colors...");

	var texPath = "../game/assets/textures/";
	var textures = getTextures();

	var loaded = 0;
	var total = Object.keys(textures).length;

	for (var i in textures) {
		(function(key) {
			getColorOfImageFirstPixel(
				texPath + textures[key].filename, function(color) {
					textures[key].color = color;

					loaded++;
					if (loaded >= total) {
						console.log("Texture colors loaded.");
						callback(textures);
					}
				});
		}(i));
	}

	function getTextures() {
		global.GS = {};
		require("../game/js/enums/Assets");

		var textures = GS.Assets[GS.AssetTypes.Texture];
		var mapTextures = _.where(Object.keys(textures), function(key) {
			return textures[key].type === GS.TextureTypes.Map;
		});

		var result = {};
		for (var i = 0; i < mapTextures.length; i++) {
			result[mapTextures[i]] = {
				filename: textures[mapTextures[i]].filename
			};
		}

		global.GS = undefined;
		return result;
	}

	function getColorOfImageFirstPixel(path, callback) {
		pngparse.parseFile(path, function(err, data) {
			if (err) {
				throw err;
			}

			var hex = data.getPixel(0, 0);
			hex = hex >> 8;
			callback(hex);
		});
	}
}

function hexToRGB(hex) {
	return {
		r: (hex >> 16 & 255),
		g: (hex >> 8 & 255),
		b: (hex & 255)
	};
}