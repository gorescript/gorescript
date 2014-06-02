GS.ActionTypes = {
	Add: 0,
	Remove: 1,
};

GS.EditorModes = {
	Drawing: 0,
	Selecting: 1,
	Disabled: 2,
};

GS.MapEditor = function() {
	this.layer = GS.MapLayers.Segment;	

	this.keys = {
		Escape: 27,
		Delete: 46,
		A: 65,
		Z: 90,
		G: 71,
		Minus: 189,
		Plus: 187,
		Zero: 48,
	};

	this.actionLog = [];
	this.init();
};

GS.MapEditor.prototype = {
	constructor: GS.MapEditor,

	init: function() {
		var that = this;

		this.canvasContainer = document.getElementById("canvas-container");
		this.menuContainer = document.getElementById("menu-container");

		this.calculateSizes();

		var screenCanvas = document.createElement("canvas");
		screenCanvas.width = this.canvasWidth;
		screenCanvas.height = this.canvasHeight;
		screenCanvas.style.backgroundColor = "rgba(255, 255, 255, 1)";
		screenCanvas.id = "map-canvas";
		$(this.canvasContainer).append(screenCanvas);
		this.screenCanvas = screenCanvas;

		var screenCtx = screenCanvas.getContext("2d");
		screenCtx.globalCompositeOperation = "source-over";
		screenCtx.save();
		this.screenCtx = screenCtx;

		var bufferCanvas = document.createElement("canvas");
		bufferCanvas.width = this.canvasWidth;
		bufferCanvas.height = this.canvasHeight;
		bufferCanvas.style.backgroundColor = "rgba(255, 255, 255, 1)";
		this.bufferCanvas = bufferCanvas;

		var bufferCtx = bufferCanvas.getContext("2d");
		bufferCtx.globalCompositeOperation = "source-over";
		bufferCtx.save();
		this.bufferCtx = bufferCtx;

		var translucentCanvas = document.createElement("canvas");
		translucentCanvas.width = this.canvasWidth;
		translucentCanvas.height = this.canvasHeight;
		translucentCanvas.style.backgroundColor = "rgba(255, 255, 255, 1)";
		this.translucentCanvas = translucentCanvas;

		var translucentCtx = translucentCanvas.getContext("2d");
		translucentCtx.globalCompositeOperation = "source-over";
		translucentCtx.save();
		this.translucentCtx = translucentCtx;

		window.addEventListener("resize", function() { that.onResize(); }, false);
		this.onResize();

		this.initComponents();
		this.initMenuControls();
		this.initModifyOriginEvent();

		$(this.canvasContainer).show();
		$(this.menuContainer).css("display", "block");

		$("#map-name").val(that.mapManager.map.name);

		this.draw();
	},

	initModifyOriginEvent: function() {
		var that = this;
		$(document).mousemove(function(e) {
			if (GS.InputHelper.middleMouseDown) {
				var mx = GS.InputHelper.mouseX;
				var my = GS.InputHelper.mouseY;
				var dx = (mx - that.ox);
				var dy = (my - that.oy);
				that.ox = mx;
				that.oy = my;

				that.mapManager.modifyOrigin(dx, dy);

				$("#map-canvas").css("cursor", "move");
			} else {
				that.ox = GS.InputHelper.mouseX;
				that.oy = GS.InputHelper.mouseY;

				$("#map-canvas").css("cursor", "default");
			}
		});
	},

	initComponents: function() {
		var that = this;
		var inCanvas = function(mx, my) { return that.inCanvas(mx, my); };

		this.mapManager = new GS.MapManager(this.bufferCanvas, this.bufferCtx);
		this.mapManager.init();

		this.layerTools = {};
		this.layerTools[GS.MapLayers.Segment] = new GS.SegmentTools(this.mapManager, this.actionLog, inCanvas);
		this.layerTools[GS.MapLayers.Segment].init();
		this.layerTools[GS.MapLayers.Sector] = new GS.SectorTools(this.mapManager, this.actionLog, inCanvas);
		this.layerTools[GS.MapLayers.Sector].init();
		this.layerTools[GS.MapLayers.Entity] = new GS.EntityTools(this.mapManager, this.actionLog, inCanvas);
		this.layerTools[GS.MapLayers.Entity].init();
		this.layerTools[GS.MapLayers.Zone] = new GS.ZoneTools(this.mapManager, this.actionLog, inCanvas);
		this.layerTools[GS.MapLayers.Zone].init();
	},

	initMenuControls: function() {
		var that = this;

		var $mapName = $("#map-name");
		this.mapManager.addEventListener("mapLoad", function() { 
			$mapName.val(that.mapManager.map.name);
			that.updatePlayerStartPosition();
		});

		var mapNameError = [
			"invalid map name:",
			"only a-z, A-Z, 0-9 and _ are allowed as characters",
			"name must be at least 1 character long",
		].join("\n");

		$mapName.on("change.mapEditor", function() {
			var name = $(this).val();
			if (that.validateMapName(name)) {
				that.mapManager.map.name = name;
			} else {
				$(this).val(that.mapManager.map.name);
				alert(mapNameError);
			}
		});

		$("#chk-has-script").on("change.mapEditor", function() { 
			that.mapManager.map.hasScript = $(this).is(":checked");
		});

		this.mapManager.addEventListener("triangleCountChange", function() { that.updateTriangles(); });

		$("#triangle-field").text(this.mapManager.map.triangleCount);
		
		$("#player-start-pos-x").on("change.mapEditor", function() {
			var n = parseInt($(this).val());
			that.mapManager.map.playerStartPosition.x = isNaN(n) ? 0 : n; 
		});
		$("#player-start-pos-y").on("change.mapEditor", function() {
			var n = parseInt($(this).val());
			that.mapManager.map.playerStartPosition.y = isNaN(n) ? 0 : n; 
		});

		var $gridCellSize = $("#grid-cell-size");
		$gridCellSize.val(that.mapManager.map.cellSize);
		$gridCellSize.on("change.mapEditor", function() {
			var n = parseInt($(this).val());
			that.mapManager.map.cellSize = isNaN(n) ? 0 : Math.abs(n);
		});

		$("#chk-snap-to-grid").on("change.mapEditor", function() { 
			that.mapManager.snapToGrid = $(this).is(":checked");
			$gridCellSize.prop("disabled", !that.mapManager.snapToGrid);
		});
		
		$("#radio-editor-mode").buttonset();
		$("#radio-editor-mode input:radio").change(function() {
			var mode;
			if ($(this).attr("id").indexOf("draw") != -1) {
				mode = GS.EditorModes.Drawing;				
			} else
			if ($(this).attr("id").indexOf("select") != -1) {
				mode = GS.EditorModes.Selecting;
			}

			for (var i in that.layerTools) {
				that.layerTools[i].mode = mode;
			}
			that.layerTools[GS.MapLayers.Sector].mode = GS.EditorModes.Selecting;
		});

		var $editorMode = $("#editor-mode");
		var $segTools = $("#seg-tools-container");
		var $secTools = $("#sec-tools-container");
		var $nttTools = $("#ntt-tools-container");
		var $zoneTools = $("#zone-tools-container");
		$("#radio-layer input:radio").change(function() {
			$segTools.hide();
			$secTools.hide();
			$nttTools.hide();
			$zoneTools.hide();

			if ($(this).attr("id").indexOf("seg") != -1) {
				that.layer = GS.MapLayers.Segment;
				$segTools.show();
				$editorMode.show();
			} else
			if ($(this).attr("id").indexOf("sec") != -1) {
				that.layer = GS.MapLayers.Sector;
				$secTools.show();
				$editorMode.hide();
			} else
			if ($(this).attr("id").indexOf("ntt") != -1) {
				that.layer = GS.MapLayers.Entity;
				$nttTools.show();
				$editorMode.show();
			} else
			if ($(this).attr("id").indexOf("zone") != -1) {
				that.layer = GS.MapLayers.Zone;
				$zoneTools.show();
				$editorMode.show();
			};
		});

		for (var i in this.layerTools) {
			this.layerTools[i].initMenuControls();
		}

		$("#button-undo").click(function() {
			that.undoLastAction();
		});

		$("#field-import").change(function() {
			that.importMap();
		});
		
		$("#button-import").click(function() {
			that.importMap();
		});

		// $("#button-download").click(function() {
		// 	that.mapManager.downloadMap();
		// });

		$("#button-save").click(function() {
			var map = that.mapManager.getMap();
			that.saveMap(map);
		});
	},

	validateMapName: function(name) {
		var re = /^[0-9a-zA-Z_]+$/;
		return re.exec(name);
	},

	saveMap: function(map) {
		$.ajax({
			type: "POST",
			url: "../../../node/urlrewrite/server/save-map",
			data: JSON.stringify(map),
		}).done(function(msg) {
			alert(msg);
		});
	},

	updatePlayerStartPosition: function() {
		$("#player-start-pos-x").val(this.mapManager.map.playerStartPosition.x);
		$("#player-start-pos-y").val(this.mapManager.map.playerStartPosition.y);
	},

	updateTriangles: function() {
		$("#triangle-field").text(this.mapManager.map.triangleCount);
	},

	importMap: function() {
		var that = this;

		var $fieldImport = $("#field-import");

		var files = $fieldImport[0].files;
		if (files == undefined || files.length == 0) {
			$fieldImport.trigger("click");
			return;
		}
		var file = files[0];

		var fileReader = new FileReader();
		fileReader.onload = function(e) {
			that.mapManager.importMap(e.target.result);
			that.actionLog.length = 0;
			for (var i in that.layerTools) {
				that.layerTools[i].resetSelection();
			}
		};
		fileReader.onerror = function(e) {
			alert("File read error: " + e.target.error.code);
		};
		fileReader.readAsText(file);

		$fieldImport.val("");
	},

	update: function() {
		var mx = GS.InputHelper.mouseX;
		var my = GS.InputHelper.mouseY;
		if (this.inCanvas(mx, my)) {
			var v = new THREE.Vector2(mx, my);
			this.mapManager.convertToGridCellCoords(v);
			$("#position-field").text("X: " + v.x.toFixed(0) + ", Y: " + v.y.toFixed(0));
		}
		else {
			$("#position-field").text("X: ---, Y: ---");
		}

		this.layerTools[this.layer].update();

		GS.InputHelper.checkPressedKeys();

		if (!GS.InputHelper.keysPressed && GS.InputHelper.ctrl && GS.InputHelper.isKeyDown(this.keys.A)) {
			this.layerTools[this.layer].onSelectAll();
		}

		if (!GS.InputHelper.keysPressed && GS.InputHelper.ctrl && GS.InputHelper.isKeyDown(this.keys.G)) {
			GS.InputHelper.keyState[this.keys.G] = false;
			this.showGoTo();
		}

		if (!GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Escape)) {
			this.layerTools[this.layer].onEscape();
		}

		if (!GS.InputHelper.keysPressed && GS.InputHelper.ctrl && GS.InputHelper.isKeyDown(this.keys.Z)) {
			this.undoLastAction();
		}

		if (!GS.InputHelper.keysPressed && GS.InputHelper.isKeyDown(this.keys.Delete)) {
			this.layerTools[this.layer].onDelete();
		}

		if (!GS.InputHelper.keysPressed && GS.InputHelper.ctrl && GS.InputHelper.isKeyDown(this.keys.Minus)) {
			this.mapManager.modifyZoom(-1);
		}

		if (!GS.InputHelper.keysPressed && GS.InputHelper.ctrl && GS.InputHelper.isKeyDown(this.keys.Plus)) {
			this.mapManager.modifyZoom(1);
		}

		if (!GS.InputHelper.keysPressed && GS.InputHelper.ctrl && GS.InputHelper.isKeyDown(this.keys.Zero)) {
			this.mapManager.resetZoom();
		}

		while (GS.InputHelper.mouseWheelEvents.length > 0) {
			var delta = GS.InputHelper.mouseWheelEvents.shift();
			if (delta < 0) {
				this.mapManager.modifyZoom(-1);
			}
			if (delta > 0) {
				this.mapManager.modifyZoom(1);
			}
		}
	},

	showGoTo: function() {
		var str = window.prompt("Go to layer object ID:", "");
		var n = parseInt(str);
		if (!isNaN(n)) {
			if (this.layerTools[this.layer].goTo(n)) {
				return;
			}
		}
		alert("layer object not found");
	},

	inCanvas: function(mx, my) { 
		return mx < this.canvasWidth;
	},

	undoLastAction: function() {
		var action = this.actionLog.pop();
		if (action) {
			switch (action.type) {
				case GS.ActionTypes.Add:
					this.layerTools[action.layer].undoAdd(action);
					break;
				case GS.ActionTypes.Remove:
					this.layerTools[action.layer].undoRemove(action);
					break;
			}
		}
	},

	draw: function() {
		var that = this;
		this.bufferCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.mapManager.drawLayer(this.bufferCtx, this.layer, this.layerTools[this.layer].getSelected());
		this.update();

		this.screenCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		if (this.drawOtherLayers()) {
			this.screenCtx.globalAlpha = 0.25;
			this.screenCtx.drawImage(this.translucentCanvas, 0, 0);
			this.screenCtx.globalAlpha = 1;
		}
		this.screenCtx.drawImage(this.bufferCanvas, 0, 0);

		requestAnimationFrame(function() { that.draw(); });
	},

	drawOtherLayers: function() {
		var drawToScreen = false;
		switch (this.layer) {
			case GS.MapLayers.Segment:
				this.translucentCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
				this.mapManager.drawLayer(this.translucentCtx, GS.MapLayers.Sector);
				this.mapManager.drawLayer(this.translucentCtx, GS.MapLayers.Entity);
				drawToScreen = true;
				break;
			case GS.MapLayers.Entity:
				this.translucentCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
				this.mapManager.drawLayer(this.translucentCtx, GS.MapLayers.Sector);
				this.mapManager.drawLayer(this.translucentCtx, GS.MapLayers.Segment);
				drawToScreen = true;
				break;
			case GS.MapLayers.Sector:
				this.translucentCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
				this.mapManager.drawLayer(this.translucentCtx, GS.MapLayers.Entity);
				drawToScreen = true;
				break;
			case GS.MapLayers.Zone:
				this.translucentCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
				this.mapManager.drawLayer(this.translucentCtx, GS.MapLayers.Sector);
				this.mapManager.drawLayer(this.translucentCtx, GS.MapLayers.Segment);
				this.mapManager.drawLayer(this.translucentCtx, GS.MapLayers.Entity);
				drawToScreen = true;
				break;
		}
		return drawToScreen;
	},

	calculateSizes: function() {
		this.minWidth = 1280;
		this.minHeight = 720;

		this.menuWidth = 300;
		this.menuHeight = Math.max(GS.getViewportHeight(), this.minHeight);
		this.canvasWidth = Math.max(GS.getViewportWidth() - this.menuWidth, this.minWidth - this.menuWidth);
		this.canvasHeight = Math.max(GS.getViewportHeight(), this.minHeight);
	},

	onResize: function() {
		this.calculateSizes();

		this.screenCanvas.width = this.canvasWidth;
		this.screenCanvas.height = this.canvasHeight;
		this.bufferCanvas.width = this.canvasWidth;
		this.bufferCanvas.height = this.canvasHeight;
		this.translucentCanvas.width = this.canvasWidth;
		this.translucentCanvas.height = this.canvasHeight;

		this.canvasContainer.width = this.canvasWidth + "px";
		this.canvasContainer.height = this.canvasHeight + "px";
		this.menuContainer.style.width = this.menuWidth + "px";
		this.menuContainer.style.height = this.menuHeight + "px";
		this.menuContainer.style.marginLeft = this.canvasWidth + "px";
	},
};

var MAP_EDITOR;
window.addEventListener("load", function() {
	MAP_EDITOR = new GS.MapEditor();
}, false);