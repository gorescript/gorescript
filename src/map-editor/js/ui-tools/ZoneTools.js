GS.ZoneTools = function(mapManager, actionLog, inCanvas) {
	GS.LayerObjectTools.call(this, mapManager, actionLog, inCanvas);
	this.layer = GS.MapLayers.Zone;

	this.isDrawingZone = false;

	this.zoneNameError = [
		"invalid zone name:",
		"only a-z, A-Z, 0-9 and _ are allowed as characters",
		"name must be at least 1 character long",
	].join("\n");
};

GS.ZoneTools.prototype = GS.inherit(GS.LayerObjectTools, {
	constructor: GS.ZoneTools,

	init: function() {
	},

	initMenuControls: function() {
		var that = this;

		this.linkCountChangeToField($("#zone-count"));
	},

	update: function() {
		var mx = GS.InputHelper.mouseX;
		var my = GS.InputHelper.mouseY;

		switch (this.mode) {
			case GS.EditorModes.Selecting:
				this.handleSelecting(mx, my);
				break;
			case GS.EditorModes.Drawing:
				this.handleDrawing(mx, my);
				break;
		}
	},

	handleDrawing: function(mx, my) {
		var v = new THREE.Vector2(mx, my);
		this.mapManager.convertToGridCellCoords(v);
		this.mapManager.drawCursorExtensions(v);

		if (GS.InputHelper.leftMouseDown) {
			if (this.inCanvas(mx, my)) {
				if (this.isDrawingZone === false) {
					this.isDrawingZone = true;
					this.zoneStart = new THREE.Vector2(mx, my);
					this.mapManager.convertToGridCellCoords(this.zoneStart);
				}
			}

			if (this.isDrawingZone) {
				this.mapManager.drawZone(this.zoneStart, v);
			}
		} else {
			if (this.isDrawingZone) {
				this.isDrawingZone = false;
				if (this.inCanvas(mx, my)) {
					if (!this.zoneStart.equalsEpsilon(v)) {
						var zone = this.mapManager.constructLayerObject(this.layer, { 
							start: this.zoneStart.clone(), 
							end: v,
						});

						this.mapManager.addLayerObject(this.layer, zone);
						this.actionLog.push(this.getAddAction(zone.id));
						this.mapManager.drawZone(this.zoneStart, v);
					}
				}
			}
		}

		this.mapManager.drawCursor(v);
	},

	validateZoneName: function(name) {
		var re = /^[0-9a-zA-Z_]+$/;
		return re.exec(name);
	},

	selectionChange: function() {
		var that = this;
		var $detail = $("#zone-tools-detail");

		var count = Object.keys(this.selected).length;
		var selected = [];
		Object.keys(this.selected).forEach(function(key) {
			selected.push(that.mapManager.getLayerObject(GS.MapLayers.Zone, key));
		});

		if (count > 0) {
			var zone;

			var $txtId = $("#zone-selected-id");
			var $txtName = $("#zone-selected-name");

			if (count == 1) {
				zone = selected[0];

				var name = zone.name || "";

				$txtId.text(zone.id);
				$txtName.val(name);
			} else {
				$txtId.text("multiple");
				$txtName.val("");
			}

			$txtName.off("change.detail");
			$txtName.on("change.detail", function() {
				var value = $(this).val();
				if (that.validateZoneName(value)) {
					for (var i = 0; i < selected.length; i++) {
						selected[i].name = value; 
					}
				} else {
					alert(that.zoneNameError);
				}
			});

			$detail.show();
		} else {
			$detail.hide();
		}
	},
});