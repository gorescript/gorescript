GS.ZipAssetLoader = function(audioContext) {
	this.audioContext = audioContext;
	this.objLoader = new THREE.OBJLoader();
	this.mapLoader = new GS.MapLoader();

	this.fontLoader = new GS.FontLoader();
	this.fontLoader.fontPath = "";

	this.zipPath = "../server/assets.zip";

	if (GS.BuildOverride === true) {
		this.zipPath = "assets.zip";
	}

	this.path = {};
	this.path[GS.AssetTypes.Texture] = "textures/";
	this.path[GS.AssetTypes.CubeTexture] = "textures/";
	this.path[GS.AssetTypes.UIWidget] = "textures/widgets/";
	this.path[GS.AssetTypes.Mesh] = "meshes/";
	this.path[GS.AssetTypes.Sound] = "sounds/";
	this.path[GS.AssetTypes.Map] = "maps/";
	this.path[GS.AssetTypes.Script] = "scripts/";
	this.path[GS.AssetTypes.MusicTrack] = "music/";

	this.reset();
};

GS.ZipAssetLoader.prototype = {
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

	loadZip: function() {
		var that = this;

		var xhr = new XMLHttpRequest();
		xhr.open("GET", this.zipPath, true);
		xhr.responseType = "arraybuffer";

		xhr.onreadystatechange = function(e) {
			if (this.readyState == 4 && this.status == 200) {
				that.zip = new JSZip(this.response);
				setTimeout(function() { that._load() }, 0);
			}
		};

		xhr.onprogress = function(e) { that.zipOnProgress(e); };

		xhr.send();
	},

	_load: function() {
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

	load: function() {
		this.loadZip();
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

	getImageFromZip: function(path) {
		var buffer = this.zip.file(path).asArrayBuffer();
		var blob = new Blob([buffer], { type: "image/png" });
		var urlCreator = window.URL || window.webkitURL;
		var imageUrl = urlCreator.createObjectURL(blob);

		var img = new Image();
		img.src = imageUrl;

		return img;
	},

	getTextureFromZip: function(path) {
		var img = this.getImageFromZip(path);
		var tex = new THREE.Texture(img);
		tex.needsUpdate = true;		

		return tex;
	},

	loadTexture: function(name, filename) {
		var path = this.path[GS.AssetTypes.Texture] + filename;

		this.assets[GS.AssetTypes.Texture][name] = this.getTextureFromZip(path);
		this.checkIfFullyLoaded();
	},

	loadCubeTexture: function(name, folder) {
		var path = this.path[GS.AssetTypes.CubeTexture] + folder + "/";		

		var tex = new THREE.Texture();
		tex.image = [];
		tex.flipY = false;

		for (var i = 0; i < GS.CubeTextureNames.length; i++) {
			tex.image[i] = this.getImageFromZip(path + GS.CubeTextureNames[i] + GS.CubeTextureExtension);
		}

		tex.needsUpdate = true;

		this.assets[GS.AssetTypes.CubeTexture][name] = tex;
		this.checkIfFullyLoaded();
	},

	loadUIWidget: function(name, filename) {
		var path = this.path[GS.AssetTypes.UIWidget] + filename;

		this.assets[GS.AssetTypes.UIWidget][name] = this.getImageFromZip(path);
		this.checkIfFullyLoaded();
	},

	loadMesh: function(name, filename) {
		var path = this.path[GS.AssetTypes.Mesh] + filename;
		var text = this.zip.file(path).asText();

		this.assets[GS.AssetTypes.Mesh][name] = this.objLoader.parse(text).children[0];
		this.checkIfFullyLoaded();
	},

	loadSound: function(name, filename, assetType) {
		var that = this;
		var path = this.path[assetType] + filename;
		var encodedBuffer = this.zip.file(path).asArrayBuffer();

		this.audioContext.decodeAudioData(encodedBuffer, function(buffer) {
			that.assets[assetType][name] = buffer;
			that.checkIfFullyLoaded();
		});
	},

	loadMap: function(name, filename) {
		var path = this.path[GS.AssetTypes.Map] + filename;
		var text = this.zip.file(path).asText();

		this.assets[GS.AssetTypes.Map][name] = this.mapLoader.parse(text);
		this.checkIfFullyLoaded();
	},

	loadScript: function(name, filename) {
		var path = this.path[GS.AssetTypes.Script] + filename;

		var scriptTag = document.createElement("script");
		scriptTag.text = this.zip.file(path).asText();
		document.body.appendChild(scriptTag);

		this.checkIfFullyLoaded();
	},

	zipOnProgress: function(e) {
		var percentLoaded = (e.loaded / e.total) * 50;
		this.dispatchEvent({ type: "progress", percentLoaded: percentLoaded.toFixed(0) });
	},

	checkIfFullyLoaded: function() {
		this.assetsToLoad--;

		var percentLoaded = (0.5 + ((this.totalAssets - this.assetsToLoad) / this.totalAssets) * 0.5) * 100;
		this.dispatchEvent({ type: "progress", percentLoaded: percentLoaded.toFixed(0) });

		if (this.assetsToLoad == 0) {
			this.loaded = true;
			this.dispatchEvent({ type: "load", percentLoaded: 100, assets: this.assets });
		}
	},
};

THREE.EventDispatcher.prototype.apply(GS.ZipAssetLoader.prototype);