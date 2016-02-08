GS.GridFactory = function(viewFactory, soundManager, renderer, scene, camera) {
	this.viewFactory = viewFactory;
	this.soundManager = soundManager;
	this.renderer = renderer;
	this.scene = scene;
	this.camera = camera;

	this.gridCellSize = 8;
};

GS.GridFactory.prototype = {
	constructor: GS.GridFactory,

	getGrid: function(map) {
		var that = this;

		var hCells = Math.ceil((map.bounds.max.x - map.bounds.min.x) / this.gridCellSize);
		var vCells = Math.ceil((map.bounds.max.y - map.bounds.min.y) / this.gridCellSize);

		var cells = [];
		for (var i = 0; i < vCells; i++) {
			cells[i] = [];
			for (var j = 0; j < hCells; j++) {
				var min = new THREE.Vector2(j * this.gridCellSize, i * this.gridCellSize).add(map.bounds.min);
				var max = new THREE.Vector2((j + 1) * this.gridCellSize, (i + 1) * this.gridCellSize).add(map.bounds.min);
				var box2 = new THREE.Box2(min, max);
				cells[i][j] = { box2: box2, children: [], x: j, y: i };
			}
		}

		var grid = new GS.Grid(this.renderer, this.scene);
		grid.clearScene();
		grid.cellSize = this.gridCellSize;
		grid.cells = cells;
		grid.width = hCells;
		grid.height = vCells;
		grid.map = map;
		grid.regionInfo = this.getRegions(map);
		grid.soundManager = this.soundManager;

		this.assignMapEntitiesToGrid(grid);
		this.addPlayerToGrid(grid);

		grid.initSkybox(this.viewFactory.getSkyboxMesh());
		grid.init();

		return grid;
	},

	getRegions: function(map) {
		var sectors = map.layerObjects[GS.MapLayers.Sector];
		var sectorLinks = map.sectorLinks;
		if (sectorLinks === undefined) {
			GAME.handleFatalError("invalid map - sector links not found");
			return;
		}

		var regionHelper = new GS.RegionHelper();
		return regionHelper.getRegions(sectors, sectorLinks);
	},

	addPlayerToGrid: function(grid) {
		var playerView = this.viewFactory.getPlayerView();
		grid.player = new GS.Player(grid, this.camera, playerView);

		var position = new THREE.Vector3();
		position.x = grid.map.playerStartPosition.x;
		position.y = 0;
		position.z = grid.map.playerStartPosition.y - 0.0001; // fix for visual bug

		grid.player.position = position;
		var gridLocation = grid.getGridLocationFromPoints([grid.map.playerStartPosition]);
		grid.player.assignToCells(gridLocation);

		grid.player.view.debugMesh = this.viewFactory.getDebugMesh(position, grid.player.size);
	},

	assignMapEntitiesToGrid: function(grid) {
		var sectorDict = {};

		var sectors = grid.map.layerObjects[GS.MapLayers.Sector];
		for (var i = 0; i < sectors.length; i++) {
			var sector = sectors[i];
			sectorDict[sector.id] = sector;

			var hasFloor = (sector.elevator !== true);
			var hasCeiling = (sector.ceiling === true && sector.door !== true);
			var gridLocation = grid.getGridLocationFromPoints(sector.collisionVertices);

			if (hasFloor || hasCeiling) {
				if (hasFloor) {
					var floor = new GS.Concrete(grid, GS.MapLayers.Sector, sector);
					floor.region = this.getRegionBySectorId(grid, sector.id);
					this.viewFactory.applySectorView(floor, false);
					floor.assignToCells(gridLocation);
				}

				if (hasCeiling) {
					var ceiling = new GS.Concrete(grid, GS.MapLayers.Sector, sector);
					ceiling.region = this.getRegionBySectorId(grid, sector.id);
					this.viewFactory.applySectorView(ceiling, true);
					ceiling.assignToCells(gridLocation);
				}
			}

			if (sector.door === true) {
				this.addDoor(grid, gridLocation, sector);
			} else
			if (sector.elevator === true) {
				this.addElevator(grid, gridLocation, sector);
			}
		}

		var segs = grid.map.layerObjects[GS.MapLayers.Segment];
		for (var i = 0; i < segs.length; i++) {
			var seg = segs[i];

			var points = [];
			points.push(new THREE.Vector2().copy(seg.start));
			points.push(new THREE.Vector2().copy(seg.end));
			var gridLocation = grid.getGridLocationFromPoints(points);

			if (seg.type !== GS.SegmentTypes.TVScreen && seg.type !== GS.SegmentTypes.Switch) {
				var gridObject = new GS.Concrete(grid, GS.MapLayers.Segment, seg);
				gridObject.sector = sectorDict[seg.sectorId];
				gridObject.region = this.getRegionBySectorId(grid, seg.sectorId);
				this.viewFactory.applySegmentView(gridObject);
				gridObject.assignToCells(gridLocation);
			} else
			if (seg.type === GS.SegmentTypes.TVScreen) {
				this.addTVScreen(grid, gridLocation, seg);
			} else
			if (seg.type === GS.SegmentTypes.Switch) {
				this.addSwitch(grid, gridLocation, seg);
			}
		}

		var entities = grid.map.layerObjects[GS.MapLayers.Entity];
		for (var i = 0; i < entities.length; i++) {
			var ntt = entities[i];

			var type = GS.MapEntities[ntt.type].type;

			var gridObject = new GS[type](grid, GS.MapLayers.Entity, ntt);
			var offset = gridObject.offset;
			var size = gridObject.size;
			gridObject.position = offset.clone();
			gridObject.position.x += ntt.pos.x;
			gridObject.position.y += ntt.y || 0;
			gridObject.position.z += ntt.pos.y;

			gridObject.isStatic = ntt.isStatic;

			var points = [
				ntt.pos.clone().add(new THREE.Vector2(offset.x, offset.z)).sub(new THREE.Vector2(size.x, size.z)),
				ntt.pos.clone().add(new THREE.Vector2(offset.x, offset.z)).add(new THREE.Vector2(size.x, size.z)),
			];
			var gridLocation = grid.getGridLocationFromPoints(points);
			this.viewFactory.applyEntityView(gridObject);
			gridObject.assignToCells(gridLocation);
			gridObject.startingSector = gridObject.getSector();
		}
	},

	addDoor: function(grid, gridLocation, sector) {
		var door = new GS.Door(grid, sector);
		this.viewFactory.applyDoorView(door);
		door.assignToCells(gridLocation);
		sector.doorOpenedEver = false;
	},

	addElevator: function(grid, gridLocation, sector) {
		var elevator = new GS.Elevator(grid, sector);
		this.viewFactory.applyElevatorView(elevator);
		elevator.assignToCells(gridLocation);
	},

	addTVScreen: function(grid, gridLocation, seg) {
		var tvScreen = new GS.TVScreen(grid, seg);
		this.viewFactory.applyTVScreenView(tvScreen);
		tvScreen.assignToCells(gridLocation);
	},

	addSwitch: function(grid, gridLocation, seg) {
		var switchObj = new GS.Switch(grid, seg);
		this.viewFactory.applySwitchView(switchObj);
		switchObj.assignToCells(gridLocation);
	},

	getRegionBySectorId: function(grid, sectorId) {
		var regions = grid.regionInfo.regions;

		for (var i = 0; i < regions.length; i++) {
			if (sectorId in regions[i].sectorIds) {
				return regions[i];
			}
		}

		GAME.handleFatalError("sector has no corresponding region");
		return;
	},
};