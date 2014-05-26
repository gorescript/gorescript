var http = require("http");
var fs = require("fs");

var mapPath = "../game/assets/maps/";
var voxelMeshPath = "../game/assets/voxel-meshes/";
var exportedMeshPath = "../game/assets/meshes/";

function respond(response, msg) {
	response.writeHead(200, { "Content-Type": "text/plain" });
	response.end(msg);
}

function processSaveFile(request, response, callback) {
	var data = "";
	request.on("data", function(chunk) {
		data += chunk;
		if (data.length > 1048576) {
			respond(response, "file larger than 1mb");
		}
	});

	request.on("end", function(err) {
		try {
			var obj = JSON.parse(data);			

			callback(obj, function(err) {
				if (err) {
					respond(response, "save error:\n" + err);
				} else {
					respond(response, "save success");
				}
			});
		} catch (e) {
			respond(response, "save error:\n" + e);
		}
	});
}

function saveMap(map, callback) {
	if (map.name === undefined) {
		throw "map doesn't have a name";
	}

	var json = JSON.stringify(map);
	var path = mapPath + map.name + ".js";

	fs.writeFile(path, json, callback);
}

function saveVoxelMesh(voxelMesh, callback) {
	if (voxelMesh.name === undefined) {
		throw "voxel mesh doesn't have a name";
	}

	var json = JSON.stringify(voxelMesh);
	var path = voxelMeshPath + voxelMesh.name + ".js";

	fs.writeFile(path, json, callback);
}

function saveExportedMesh(mesh, callback) {
	if (mesh.name === undefined) {
		throw "mesh doesn't have a name";
	}

	var path = exportedMeshPath + mesh.name + ".js";

	fs.writeFile(path, mesh.obj, callback);
}

http.createServer(function(request, response) {

	var path = "/node/urlrewrite/server/";

	switch (request.url) {
		case path + "save-map":
			processSaveFile(request, response, saveMap);
			break;

		case path + "save-voxel-mesh":
			processSaveFile(request, response, saveVoxelMesh);
			break;

		case path + "save-exported-mesh":
			processSaveFile(request, response, saveExportedMesh);
			break;

		default:
			response.writeHead(404, { "Content-Type": "text/plain" });
			response.end("what\n");
	}

}).listen(process.env.PORT);