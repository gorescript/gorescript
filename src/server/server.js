var http = require("http");
var path = require("path");
var paperboy = require('paperboy');
var fs = require("fs");

var webroot = path.join(__dirname, '../');
var mapPath = path.join(__dirname, "../game/assets/maps/");
var voxelMeshPath = path.join(__dirname, "../game/assets/voxel-meshes/");
var exportedMeshPath = path.join(__dirname, "../game/assets/meshes/");

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

function static(req, res, root) {
    var ip = req.connection.remoteAddress;
  paperboy
    .deliver(root, req, res)
    .before(function() {
      console.log('Request received for ' + req.url);
    })
    .after(function(statusCode) {
      console.log(statusCode + ' - ' + req.url + ' ' + ip);
    })
    .error(function(statusCode, msg) {
      console.log([statusCode, msg, req.url, ip].join(' '));
      res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
      res.end('Error [' + statusCode + ']');
    })
    .otherwise(function(err) {
      console.log([404, err, req.url, ip].join(' '));
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Error 404: File not found');
    });    
}

http.createServer(function(request, response) {

	var reqPath = "/node/urlrewrite/server/";
    
    switch (request.url) {
        case reqPath + "save-map":
            processSaveFile(request, response, saveMap);
            break;

        case reqPath + "save-voxel-mesh":
            processSaveFile(request, response, saveVoxelMesh);
            break;

        case reqPath + "save-exported-mesh":
            processSaveFile(request, response, saveExportedMesh);
            break;
        case "/":
            static(request, response, webroot + "server/");
            break;
        default:
            static(request, response, webroot);
    }  
}).listen(9001);