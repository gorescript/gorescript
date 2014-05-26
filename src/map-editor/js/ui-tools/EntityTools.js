GS.EntityTools = function(mapManager, actionLog, inCanvas) {
	GS.LayerObjectTools.call(this, mapManager, actionLog, inCanvas);
	this.layer = GS.MapLayers.Entity;

	this.mousePressed = false;

	this.defaultEntity = Object.keys(GS.MapEntities)[0];
	this.entity = this.defaultEntity;
};

GS.EntityTools.prototype = GS.inherit(GS.LayerObjectTools, {
	constructor: GS.EntityTools,

	init: function() {
	},

	initMenuControls: function() {
		var that = this;

		var $nttTypeSelect = $("#ntt-type-select");
		Object.keys(GS.MapEntities).forEach(function(key) {
			if (key == that.defaultEntity) {
				$nttTypeSelect.append("<option value='" + key +"' selected>" + GS.MapEntities[key].name + "</option>");
			} else {
				$nttTypeSelect.append("<option value='" + key +"'>" + GS.MapEntities[key].name + "</option>");
			}
		});

		$nttTypeSelect.on("change", function() {
			that.entity = $(this).find(":selected").val();
		});

		$("#button-compute-ntt-y").click(function() {
			that.mapManager.computeYForEntities(that.selected);
		});

		this.linkCountChangeToField($("#ntt-count"));
	},

	update: function() {
		if (!GS.InputHelper.leftMouseDown) {
			this.mousePressed = false;
		}

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

		this.mapManager.drawEntity(v, this.entity, GS.MapEntities[this.entity].name);

		if (GS.InputHelper.leftMouseDown && !this.mousePressed) {
			if (this.inCanvas(mx, my)) {
				var containsEntity = this.mapManager.isEntityAt(v);
				if (!containsEntity) {
					var ntt = this.mapManager.constructLayerObject(this.layer, { pos: v, type: this.entity });
					this.mapManager.addLayerObject(this.layer, ntt);
					this.actionLog.push(this.getAddAction(ntt.id));
				}
				this.mousePressed = true;
			}
		}

		this.mapManager.drawCursor(v);
	},

	selectionChange: function() {
		var that = this;
		var $detail = $("#ntt-tools-detail");

		var count = Object.keys(this.selected).length;
		var selected = [];
		Object.keys(this.selected).forEach(function(key) {
			selected.push(that.mapManager.getLayerObject(GS.MapLayers.Entity, key));
		});

		if (count > 0) {
			var ntt;

			var $txtId = $("#ntt-selected-id");
			var $txtY = $("#ntt-selected-y");
			var $chkStatic = $("#chk-ntt-selected-static");

			if (count == 1) {
				ntt = selected[0];

				var isStatic = (ntt.isStatic !== undefined) ? ntt.isStatic : false;

				$txtId.text(ntt.id);
				$txtY.val(ntt.y || 0);
				$chkStatic.prop("checked", isStatic);
			} else {
				$txtId.text("multiple");
				$txtY.val("");
				$chkStatic.prop("checked", false);
			}

			$txtY.off("change.detail");
			$txtY.on("change.detail", function() { 
				var n = parseInt($(this).val());
				for (var i = 0; i < selected.length; i++) {
					selected[i].y = isNaN(n) ? 0 : n; 
				}
			});

			$chkStatic.off("change.detail");
			$chkStatic.on("change.detail", function() { 
				var value = $(this).is(":checked");
				for (var i = 0; i < selected.length; i++) {
					selected[i].isStatic = value;
				}
			});

			$detail.show();
		} else {
			$detail.hide();
		}
	},
});