GS.LayerObjectTools = function(mapManager, actionLog, inCanvas) {
	this.layer = undefined;
	this.mapManager = mapManager;
	this.actionLog = actionLog;
	this.inCanvas = inCanvas;

	this.isSelecting = false;
	this.mode = GS.EditorModes.Drawing;
	this.selected = {};	
};

GS.LayerObjectTools.prototype = {
	constructor: GS.LayerObjectTools,

	linkCountChangeToField: function(field) {
		var that = this;
		var $countField = $(field);

		this.mapManager.addEventListener("layerObjectCountChange", function(e) {
			if (e.layer == that.layer) {
				$countField.text(that.mapManager.getLayerObjectCount(that.layer));
			}
		});
	},

	deleteSelected: function() {
		this.actionLog.push(this.getRemoveAction());
		this.mapManager.removeLayerObjects(this.layer, this.selected);
		this.selected = {};
		this.selectionChange();
	},

	resetSelection: function() {
		this.selected = {};
		this.selectionChange();
	},

	onSelectAll: function() {
		this.selected = this.mapManager.getSelectionOfAllLayerObjects(this.layer);
		this.selectionChange();
	},

	onEscape: function() {
		this.selected = {};
		this.selectionChange();
	},

	onDelete: function() {		
		this.deleteSelected();
	},

	goTo: function(id) {
		var obj = this.mapManager.getLayerObject(this.layer, id);
		if (obj !== undefined) {
			this.selected = {};
			this.selected[id] = true;
			this.selectionChange();
			return true;
		}
		return false;
	},

	handleSelecting: function(mx, my) {
		if (!this.inCanvas(mx, my)) {
			return;
		}

		var ctrlPressed = GS.InputHelper.ctrl;

		var v = new THREE.Vector2(mx, my);		

		if (GS.InputHelper.leftMouseDown) {
			if (this.inCanvas(mx, my)) {
				if (this.isSelecting == false) {					
					this.isSelecting = true;
					this.selectStart = v;
				}
			}
			if (this.isSelecting) {
				this.mapManager.drawSelection(this.selectStart, v);
			}
		} else {
			if (this.isSelecting) {
				this.isSelecting = false;
				var selection = this.mapManager.getLayerObjectsInSelection(this.layer, this.selectStart, v);
				if (ctrlPressed) {
					this.addSelection(selection);
				} else {
					this.selected = selection;
				}
				this.selectionChange();
			}
		}
	},

	selectionChange: function() {
	},

	addSelection: function(selection) {
		var that = this;
		var n = Object.keys(this.selected).length;
		if (n == 0) {
			this.selected = selection;
			return;
		}

		Object.keys(selection).forEach(function(key) {
			if (that.selected[key] === undefined) {
				that.selected[key] = true;
			} else {
				delete that.selected[key];
			}
		});
	},

	undoAdd: function(action) {
		this.mapManager.removeLayerObject(this.layer, action.info.id);
	},

	undoRemove: function(action) {
		for (var i = 0; i < action.info.objects.length; i++) {
			this.mapManager.addLayerObject(this.layer, action.info.objects[i]);
		}
	},

	getSelected: function() {
		return this.selected;
	},

	getAddAction: function(id) {
		var action = {
			type: GS.ActionTypes.Add,
			layer: this.layer,
			info: { id: id },
		};
		return action;
	},

	getRemoveAction: function() {
		var objects = [];
		for (var i in this.selected) {
			var obj = this.mapManager.getLayerObject(this.layer, i);
			var clone = {};
			$.extend(true, clone, obj);
			objects.push(clone);
		}

		var action = {
			type: GS.ActionTypes.Remove,
			layer: this.layer,
			info: { objects: objects },
		};

		return action;
	},
};