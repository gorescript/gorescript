GS.SectorTools = function(mapManager, actionLog, inCanvas) {
	GS.LayerObjectTools.call(this, mapManager, actionLog, inCanvas);
	this.mode = GS.EditorModes.Selecting;
	this.layer = GS.MapLayers.Sector;

	this.showSubSectors = false;
};

GS.SectorTools.prototype = GS.inherit(GS.LayerObjectTools, {
	constructor: GS.SectorTools,

	init: function() {
	},

	initMenuControls: function() {
		var that = this;

		$("#radio-sec-tri-mode").buttonset();
		$("#radio-sec-tri-mode input:radio").change(function() {
			var id = $(this).attr("id");
			var value;
			if (id.indexOf("none") != -1) {
				value = GS.SectorTriangleModes.None;
			} else
			if (id.indexOf("rendering") != -1) {
				value = GS.SectorTriangleModes.Rendering;
			} else
			if (id.indexOf("collision") != -1) {
				value = GS.SectorTriangleModes.Collision;
			}
			that.mapManager.sectorTriangleMode = value;
		});

		$("#sec-selected-light-level").slider({
			min: 0,
			max: 10,
			step: 1,
		});

		this.floorTexPicker = this.getTexPicker("#sec-selected-floor-tex");
		this.ceilTexPicker = this.getTexPicker("#sec-selected-ceil-tex");
		this.sideTexPicker = this.getTexPicker("#sec-selected-side-tex");

		this.linkCountChangeToField($("#sec-count"));
	},

	getTexPicker: function(selector) {
		var that = this;
		var texPicker = new GS.TexturePicker($(selector));
		texPicker.addEventListener("open", function() {
			that.previousMode = that.mode;
			that.mode = GS.EditorModes.Disabled;
		});
		texPicker.addEventListener("close", function() {
			that.mode = that.previousMode;
		});
		return texPicker;
	},

	update: function() {
		var mx = GS.InputHelper.mouseX;
		var my = GS.InputHelper.mouseY;

		switch (this.mode) {
			case GS.EditorModes.Selecting:
				this.handleSelecting(mx, my);
				break;
		}
	},

	hexToStyle: function(hex) {
		return ("#" + this.pad(hex.toString(16), 6));
	},

	styleToHex: function(style) {
		style = style.substr(1);
		return parseInt(style, 16);
	},

	pad: function(n, width, z) {
		z = z || "0";
		n = n + "";
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	},

	selectionChange: function() {
		var that = this;
		var $detail = $("#sec-tools-detail");

		var count = Object.keys(this.selected).length;
		var selected = [];
		Object.keys(this.selected).forEach(function(key) {
			selected.push(that.mapManager.getLayerObject(GS.MapLayers.Sector, key));
		});

		if (count > 0) {
			var sector;

			var $txtId = $("#sec-selected-id");
			var $chkCeil = $("#chk-sec-ceil");
			var $txtFloorHeight = $("#sec-selected-floor-height");
			var $txtFloorCeilDist = $("#sec-selected-floor-ceil-dist");
			var $txtCeilThickness = $("#sec-selected-ceil-thickness");
			var $chkDoor = $("#chk-sec-door");
			var $txtDoorMaxHeight = $("#sec-selected-door-max-height");
			var $chkElevator = $("#chk-sec-elevator");
			var $txtElevatorMaxHeight = $("#sec-selected-elevator-max-height");
			var $txtFloorTexId = $("#sec-selected-floor-tex");
			var $txtCeilTexId = $("#sec-selected-ceil-tex");
			var $txtSideTexId = $("#sec-selected-side-tex");
			var $txtLightLevel = $("#sec-selected-light-level-text");
			var $sldLightLevel = $("#sec-selected-light-level");
			var $clrLightColor = $("#sec-selected-light-color");

			$sldLightLevel.off("slidechange.detail");

			if (count == 1) {
				sector = selected[0];

				var hasCeiling = (sector.ceiling !== undefined) ? sector.ceiling : true;				
				var floorHeight = sector.floorTopY;
				var floorCeilDist = sector.ceilBottomY - floorHeight;
				var ceilThickness = sector.ceilTopY - sector.ceilBottomY;
				var isDoor = (sector.door !== undefined) ? sector.door : false;
				var doorMaxHeight = (sector.doorMaxHeight !== undefined) ? sector.doorMaxHeight : 16;
				var isElevator = (sector.elevator !== undefined) ? sector.elevator : false;
				var elevatorMaxHeight = (sector.elevatorMaxHeight !== undefined) ? sector.elevatorMaxHeight : 16;

				$txtId.text(sector.id);
				$txtFloorHeight.val(floorHeight);
				$chkCeil.prop("checked", hasCeiling);
				$txtFloorCeilDist.val(floorCeilDist);
				$txtCeilThickness.val(ceilThickness);
				$txtFloorCeilDist.prop("disabled", !hasCeiling);
				$txtCeilThickness.prop("disabled", !hasCeiling);
				$chkDoor.prop("checked", isDoor);
				$txtDoorMaxHeight.val(doorMaxHeight);
				$txtDoorMaxHeight.prop("disabled", !isDoor);
				$chkElevator.prop("checked", isElevator);
				$txtElevatorMaxHeight.val(elevatorMaxHeight);
				$txtElevatorMaxHeight.prop("disabled", !isElevator);
				$txtFloorTexId.val(sector.floorTexId);
				$txtCeilTexId.val(sector.ceilTexId);
				$txtSideTexId.val(sector.sideTexId);
				$txtLightLevel.text(sector.lightLevel);
				$sldLightLevel.slider("option", "value", sector.lightLevel);
				$clrLightColor.val(this.hexToStyle(sector.lightColor));
			} else {
				$txtId.text("multiple");
				$txtFloorHeight.val("");
				$chkCeil.prop("checked", true);
				$txtFloorCeilDist.val("");
				$txtCeilThickness.val("");
				$txtFloorCeilDist.prop("disabled", false);
				$txtCeilThickness.prop("disabled", false);
				$chkDoor.prop("checked", false);
				$txtDoorMaxHeight.prop("disabled", false);
				$chkElevator.prop("checked", false);
				$txtElevatorMaxHeight.prop("disabled", false);
				$txtFloorTexId.val("");
				$txtCeilTexId.val("");
				$txtSideTexId.val("");
				$txtLightLevel.text("5");
				$sldLightLevel.slider("option", "value", 5);
				$clrLightColor.val("#ad00ad");
			}

			this.floorTexPicker.draw();
			this.ceilTexPicker.draw();
			this.sideTexPicker.draw();

			$txtFloorHeight.off("change.detail");
			$txtFloorHeight.on("change.detail", function() { 
				var n = parseInt($(this).val());
				n = isNaN(n) ? 0 : n;
				for (var i = 0; i < selected.length; i++) {
					var floorCeilDist = selected[i].ceilBottomY - selected[i].floorTopY;
					var ceilThickness = selected[i].ceilTopY - selected[i].ceilBottomY;
					selected[i].floorTopY = n;
					selected[i].floorBottomY = n;
					selected[i].ceilBottomY = n + floorCeilDist;
					selected[i].ceilTopY = n + floorCeilDist + ceilThickness;
				}
			});

			$chkCeil.off("change.detail");
			$chkCeil.on("change.detail", function() { 
				for (var i = 0; i < selected.length; i++) {
					selected[i].ceiling = $(this).is(":checked");
					$txtFloorCeilDist.prop("disabled", !selected[i].ceiling);
					$txtCeilThickness.prop("disabled", !selected[i].ceiling);
				}
			});			

			$txtFloorCeilDist.off("change.detail");
			$txtFloorCeilDist.on("change.detail", function() { 
				var n = parseInt($(this).val());
				n = isNaN(n) ? 0 : n;
				if (n > 0) {
					for (var i = 0; i < selected.length; i++) {
						var ceilThickness = selected[i].ceilTopY - selected[i].ceilBottomY;
						selected[i].ceilBottomY = selected[i].floorBottomY + n;
						selected[i].ceilTopY = selected[i].ceilBottomY + ceilThickness;
					}
				}
			});

			$txtCeilThickness.off("change.detail");
			$txtCeilThickness.on("change.detail", function() { 
				var n = parseInt($(this).val());
				n = isNaN(n) ? 0 : n;
				for (var i = 0; i < selected.length; i++) {
					selected[i].ceilTopY = selected[i].ceilBottomY + n;
				}
			});

			$chkDoor.off("change.detail");
			$chkDoor.on("change.detail", function() { 
				var value = $(this).is(":checked");
				for (var i = 0; i < selected.length; i++) {					
					selected[i].door = value;
					if (value) {
						selected[i].elevator = false;
					}
				}
				if (value) {
					$chkElevator.prop("checked", false);
					$txtElevatorMaxHeight.prop("disabled", true);
				}
				$txtDoorMaxHeight.prop("disabled", !value);
			});

			$txtDoorMaxHeight.off("change.detail");
			$txtDoorMaxHeight.on("change.detail", function() { 
				var n = parseInt($(this).val());
				n = isNaN(n) ? 0 : n;
				if (n >= 0) {
					for (var i = 0; i < selected.length; i++) {
						selected[i].doorMaxHeight = n;
					}
				}
			});

			$chkElevator.off("change.detail");
			$chkElevator.on("change.detail", function() { 
				var value = $(this).is(":checked");
				for (var i = 0; i < selected.length; i++) {
					selected[i].elevator = value;
					if (value) {
						selected[i].door = false;
					}
				}
				if (value) {
					$chkDoor.prop("checked", false);
					$txtDoorMaxHeight.prop("disabled", true);
				}
				$txtElevatorMaxHeight.prop("disabled", !value);
			});

			$txtElevatorMaxHeight.off("change.detail");
			$txtElevatorMaxHeight.on("change.detail", function() { 
				var n = parseInt($(this).val());
				n = isNaN(n) ? 0 : n;
				if (n >= 0) {
					for (var i = 0; i < selected.length; i++) {
						selected[i].elevatorMaxHeight = n;
					}
				}
			});

			$txtFloorTexId.off("change.detail");
			$txtFloorTexId.on("change.detail", function() {
				var value = $(this).val();
				for (var i = 0; i < selected.length; i++) {
					selected[i].floorTexId = value;
				}
			});

			$txtCeilTexId.off("change.detail");
			$txtCeilTexId.on("change.detail", function() {
				var value = $(this).val();
				for (var i = 0; i < selected.length; i++) {
					selected[i].ceilTexId = value;
				}
			});

			$txtSideTexId.off("change.detail");
			$txtSideTexId.on("change.detail", function() {
				var value = $(this).val();
				for (var i = 0; i < selected.length; i++) {
					selected[i].sideTexId = value;
				}
			});

			$sldLightLevel.off("slide.detail");
			$sldLightLevel.on("slide.detail", function(e, ui) {
				$txtLightLevel.text(ui.value);
			});
			
			$sldLightLevel.on("slidechange.detail", function(e, ui) {
				for (var i = 0; i < selected.length; i++) {
					selected[i].lightLevel = ui.value;
				}
			});

			$clrLightColor.off("change.detail");
			$clrLightColor.on("change.detail", function(e, ui) {
				var value = that.styleToHex($(this).val());
				for (var i = 0; i < selected.length; i++) {
					selected[i].lightColor = value;
				}
			});

			$detail.show();
		} else {
			$detail.hide();
		}
	},
});