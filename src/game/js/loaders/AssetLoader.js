GS.AssetLoader = function(audioContext) {
	this.audioContext = audioContext;
	this.objLoader = new THREE.OBJLoader();
	this.mapLoader = new GS.MapLoader();

	this.fontLoader = new GS.FontLoader();
	this.fontLoader.fontPath = "assets/fonts/";

	this.path = {};
	this.path[GS.AssetTypes.Texture] = "assets/textures/";
	this.path[GS.AssetTypes.CubeTexture] = "assets/textures/";
	this.path[GS.AssetTypes.UIWidget] = "assets/textures/widgets/";
	this.path[GS.AssetTypes.Mesh] = "assets/meshes/";
	this.path[GS.AssetTypes.Sound] = "assets/sounds/";
	this.path[GS.AssetTypes.Map] = "assets/maps/";
	this.path[GS.AssetTypes.Script] = "assets/scripts/";
	this.path[GS.AssetTypes.MusicTrack] = "assets/music/";

	this.reset();
};

GS.AssetLoader.prototype = {
	reset: function() {
		this.loaded = false;
		this.assetsToLoad = 0;
		this.queue = [];

		this.assets = {};
		this.assets[GS.AssetTypes.Texture] = {};
		this.assets[GS.AssetTypes.CubeTexture] = {};
		this.assets[GS.AssetTypes.UIWidget] = {};
		this.assets[GS.AssetTypes.Mesh] = {};
		this.assets[GS.AssetTypes.Sound] = {};
		this.assets[GS.AssetTypes.Map] = {};
		this.assets[GS.AssetTypes.Script] = {};
		this.assets[GS.AssetTypes.MusicTrack] = {};
	},

	init: function() {
		for (var j in GS.AssetTypes) {
			var assetDict = GS.Assets[GS.AssetTypes[j]];
			for (var i in assetDict) {
				this.add(i, assetDict[i].filename, GS.AssetTypes[j]);
			}
		}
	},

	add: function(name, filename, type) {		
		this.queue.push({
			name: name,
			filename: filename,
			type: type,
		});
		this.assetsToLoad++;
	},

	load: function() {
		var that = this;
		
		this.totalAssets = this.queue.length + 1;
		this.assetsToLoad++;
		this.fontLoader.load("hudFont", GS.CustomFontFile, function() {
			that.checkIfFullyLoaded();
		});

		var asset;
		while (this.queue.length > 0) {
			asset = this.queue.pop();

			if (asset.name in this.assets[asset.type]) {
				this.assetsToLoad--;
				continue;
			}

			this.loadAsset(asset);
		}
	},

	loadAsset: function(asset) {
		switch (asset.type) {
			case GS.AssetTypes.Texture:
				this.loadTexture(asset.name, asset.filename);
				break;
			case GS.AssetTypes.CubeTexture:
				this.loadCubeTexture(asset.name, asset.filename);
				break;
			case GS.AssetTypes.UIWidget:
				this.loadUIWidget(asset.name, asset.filename);
				break;	
			case GS.AssetTypes.Mesh:
				this.loadMesh(asset.name, asset.filename);
				break;
			case GS.AssetTypes.Sound:
				this.loadSound(asset.name, asset.filename, GS.AssetTypes.Sound);
				break;
			case GS.AssetTypes.Map:
				this.loadMap(asset.name, asset.filename);
				break;
			case GS.AssetTypes.Script:
				this.loadScript(asset.name, asset.filename);
				break;
			case GS.AssetTypes.MusicTrack:
				this.loadSound(asset.name, asset.filename, GS.AssetTypes.MusicTrack);
				break;
		}
	},	

	loadTexture: function(name, filename) {
		var that = this;
		var path = this.path[GS.AssetTypes.Texture] + filename;
		that.assets[GS.AssetTypes.Texture][name] = THREE.ImageUtils.loadTexture(path, undefined, function() {
			that.checkIfFullyLoaded();
		});
	},

	loadCubeTexture: function(name, folder) {
		var that = this;
		var path = this.path[GS.AssetTypes.CubeTexture] + folder + "/";
		var paths = [];

		for (var i = 0; i < GS.CubeTextureNames.length; i++) {
			paths.push(path + GS.CubeTextureNames[i] + GS.CubeTextureExtension);
		}

		that.assets[GS.AssetTypes.CubeTexture][name] = THREE.ImageUtils.loadTextureCube(paths, undefined, function() {
			that.checkIfFullyLoaded();
		});
	},

	loadUIWidget: function(name, filename) {
		var that = this;
		var path = this.path[GS.AssetTypes.UIWidget] + filename;
		THREE.ImageUtils.loadTexture(path, undefined, function(tex) {
			that.assets[GS.AssetTypes.UIWidget][name] = tex.image;
			that.checkIfFullyLoaded();
		});
	},

	loadMesh: function(name, filename) {
		var that = this;
		var path = this.path[GS.AssetTypes.Mesh] + filename;

		this.objLoader.load(path, function(obj) {
			that.assets[GS.AssetTypes.Mesh][name] = obj.children[0];
			that.checkIfFullyLoaded();
		});
	},

	loadSound: function(name, filename, assetType) {
		var that = this;
		var path = this.path[assetType] + filename;

		var xhr = new XMLHttpRequest();
		xhr.open("GET", path, true);
		xhr.responseType = "arraybuffer";
		xhr.onload = function() {
			that.audioContext.decodeAudioData(this.response, function(buffer) {
				that.assets[assetType][name] = buffer;
				that.checkIfFullyLoaded();
			});
		};

		xhr.send();
	},

	loadMap: function(name, filename) {
		var that = this;

		this.mapLoader.load(name, filename, function(map) {
			that.assets[GS.AssetTypes.Map][name] = map;
			that.checkIfFullyLoaded();
		});
	},

	loadScript: function(name, filename) {
		var that = this;
		var path = this.path[GS.AssetTypes.Script] + filename;

		$.ajax({
			url: path,
			dataType: "script", 
			crossDomain: true,
			success: function() {
				that.checkIfFullyLoaded();
			},
		});
	},

	checkIfFullyLoaded: function() {
		this.assetsToLoad--;

		var percentLoaded = (this.totalAssets - this.assetsToLoad) / this.totalAssets * 100;
		this.dispatchEvent({ type: "progress", percentLoaded: percentLoaded.toFixed(0) });

		if (this.assetsToLoad === 0) {
			this.loaded = true;
			this.dispatchEvent({ type: "load", percentLoaded: 100, assets: this.assets });
		}
	},
};

THREE.EventDispatcher.prototype.apply(GS.AssetLoader.prototype);