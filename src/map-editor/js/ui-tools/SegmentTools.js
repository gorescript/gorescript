GS.SegmentTools = function(mapManager, actionLog, inCanvas) {
	GS.LayerObjectTools.call(this, mapManager, actionLog, inCanvas);
	this.layer = GS.MapLayers.Segment;

	this.isDrawingLine = false;
	this.connectOnlyExisting = false;
	this.showNormals = false;
};

GS.SegmentTools.prototype = GS.inherit(GS.LayerObjectTools, {
	constructor: GS.SegmentTools,

	init: function() {
	},

	initMenuControls: function() {
		var that = this;

		$("#button-seg-to-sec").click(function() {
			that.mapManager.convertSegmentsToSectors(that.selected);
			that.resetSelection();
		});

		$("#button-flip-seg-normals").click(function() {
			that.mapManager.flipSegmentNormals(that.selected);
		});

		$("#button-regenerate-sides").click(function() {
			that.mapManager.convertEdgesToSegments();
			that.resetSelection();
		});

		$("#radio-seg-con").buttonset();
		$("#radio-seg-con input:radio").change(function() {
			that.connectOnlyExisting = $(this).attr("id").indexOf("only-existing") != -1;
		});

		$("#chk-seg-normals").change(function() {
			that.mapManager.showSegmentNormals = $(this).is(":checked");
		});

		$("#chk-seg-show-user").change(function() {
			that.mapManager.showUserDrawnSegments = $(this).is(":checked");
		});

		$("#chk-seg-show-int-floor").change(function() {
			that.mapManager.showGeneratedInteriorFloorSides = $(this).is(":checked");
		});

		$("#chk-seg-show-int-ceil").change(function() {
			that.mapManager.showGeneratedInteriorCeilingSides = $(this).is(":checked");
		});

		$("#chk-seg-show-ext").change(function() {
			that.mapManager.showGeneratedExteriorSides = $(this).is(":checked");
		});

		$("#chk-seg-show-tv").change(function() {
			that.mapManager.showTVScreens = $(this).is(":checked");
		});

		this.texPicker = new GS.TexturePicker($("#seg-selected-tex"));
		this.texPicker.addEventListener("open", function() {
			that.previousMode = that.mode;
			that.mode = GS.EditorModes.Disabled;
		});
		this.texPicker.addEventListener("close", function() {
			that.mode = that.previousMode;
		});

		this.linkCountChangeToField($("#segment-count"));
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

		if (this.isDrawingLine && GS.InputHelper.shift) {
			var angle = Math.abs(GS.MathHelper.vec2Angle(v, this.lineStart) / 2);
			if (angle >= 45 && angle < 135) {
				v.x = this.lineStart.x;
			} else {
				v.y = this.lineStart.y;
			}
		}

		var containsSegmentPoint = false;
		if (this.connectOnlyExisting) {
			containsSegmentPoint = this.mapManager.isSegmentPointAt(v) || 
				(this.lineStart !== undefined && this.mapManager.isSegmentPointAt(this.lineStart));
		}

		this.mapManager.drawCursorExtensions(v);

		var color;
		if (GS.InputHelper.leftMouseDown) {
			if (this.inCanvas(mx, my)) {
				if (this.isDrawingLine === false) {
					this.isDrawingLine = true;
					this.lineStart = new THREE.Vector2(mx, my);
					this.mapManager.convertToGridCellCoords(this.lineStart);
				}

				color = "#000";
				if (this.connectOnlyExisting) {
					color = containsSegmentPoint ? "#00ff00" : "#ff0000";
				}
			}

			if (this.isDrawingLine) {				
				this.mapManager.drawSegment(this.lineStart, v, color);
			}
		} else {
			if (this.isDrawingLine) {
				this.isDrawingLine = false;
				if (this.inCanvas(mx, my) && (this.connectOnlyExisting && containsSegmentPoint || !this.connectOnlyExisting)) {
					if (this.lineStart.x != v.x || this.lineStart.y != v.y) {						
						var seg = this.mapManager.constructLayerObject(this.layer, { 
							start: this.lineStart.clone(), 
							end: v,
							type: GS.SegmentTypes.User, 
							bottomY: 0,
							topY: 64,
							texId: "wall",
						});

						this.mapManager.addLayerObject(this.layer, seg);
						this.actionLog.push(this.getAddAction(seg.id));
						this.mapManager.drawSegment(this.lineStart, v);
					}
				}
			}
		}

		this.mapManager.drawCursor(v);
	},

	selectionChange: function() {
		var that = this;
		var $detail = $("#seg-tools-detail");

		var count = Object.keys(this.selected).length;
		var selected = [];
		Object.keys(this.selected).forEach(function(key) {
			selected.push(that.mapManager.getLayerObject(GS.MapLayers.Segment, key));
		});

		if (count > 0) {
			var seg;

			var $txtId = $("#seg-selected-id");
			var $txtBottomY = $("#seg-selected-bottom-y");
			var $txtTopY = $("#seg-selected-top-y");
			var $chkTVScreen = $("#chk-seg-selected-tv");
			var $chkSwitch = $("#chk-seg-selected-switch");
			var $txtTexId = $("#seg-selected-tex");

			if (count == 1) {
				seg = selected[0];

				var isTVScreen = (seg.type === GS.SegmentTypes.TVScreen);
				var isSwitch = (seg.type === GS.SegmentTypes.Switch);

				$txtId.text(seg.id);
				$txtBottomY.val(seg.bottomY);
				$txtTopY.val(seg.topY);
				$chkTVScreen.prop("checked", isTVScreen);
				$chkSwitch.prop("checked", isSwitch);
				$txtTexId.val(seg.texId);
			} else {
				$txtId.text("multiple");
				$txtBottomY.val("");
				$txtTopY.val("");
				$chkTVScreen.prop("checked", false);
				$chkSwitch.prop("checked", false);
				$txtTexId.val("");
			}

			this.texPicker.draw();

			$txtBottomY.off("change.detail");
			$txtBottomY.on("change.detail", function() {				
				var n = parseInt($(this).val());
				for (var i = 0; i < selected.length; i++) {
					selected[i].bottomY = isNaN(n) ? 0 : n; 
				}
			});

			$txtTopY.off("change.detail");
			$txtTopY.on("change.detail", function() { 
				var n = parseInt($(this).val());
				for (var i = 0; i < selected.length; i++) {
					selected[i].topY = isNaN(n) ? 0 : n;
				}
			});

			$chkTVScreen.off("change.detail");
			$chkTVScreen.on("change.detail", function() { 
				var value = $(this).is(":checked");
				for (var i = 0; i < selected.length; i++) {
					if (value) {
						$chkSwitch.prop("checked", false);
						selected[i].type = GS.SegmentTypes.TVScreen;
					} else {
						selected[i].type = GS.SegmentTypes.User;
					}
				}
			});

			$chkSwitch.off("change.detail");
			$chkSwitch.on("change.detail", function() { 
				var value = $(this).is(":checked");
				for (var i = 0; i < selected.length; i++) {
					if (value) {
						$chkTVScreen.prop("checked", false);
						selected[i].type = GS.SegmentTypes.Switch;
					} else {
						selected[i].type = GS.SegmentTypes.User;
					}
				}				
			});

			$txtTexId.off("change.detail");
			$txtTexId.on("change.detail", function() {
				var value = $(this).val();
				for (var i = 0; i < selected.length; i++) {
					selected[i].texId = value;
				}
			});

			$detail.show();
		} else {
			$detail.hide();
		}
	},
});