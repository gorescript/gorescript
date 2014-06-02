GS.LoadingUI = function() {	
	this.redraw = true;
	this.hidden = true;

	this.spinnerOnly = false;

	this.screenInfo = {
		width: null,
		height: null,
		center: new THREE.Vector2(),
	};

	this.loadingBox = {
		width: 0.5,
		height: 0.05,
		contentPadding: 0.005,
		topLeft: new THREE.Vector2(),
		bottomRight: new THREE.Vector2(),
		contentTopLeft: new THREE.Vector2(),
		contentBottomRight: new THREE.Vector2(),
		contentCurrentBottomRight: new THREE.Vector2(),
	};

	this.percentLoaded = 0;
};

GS.LoadingUI.prototype = {
	init: function() {
		this.computeScreenInfo();

		this.cvs = new GS.Canvas2d(true);
		this.cvs.canvasId = "loading-canvas";
		this.cvs.init();
		this.cvs.screenCanvas.style.zIndex = 50;
	},

	draw: function() {
		if (this.hidden || !this.redraw) {
			return;
		}

		this.redraw = false;

		this.cvs.clear();

		if (this.spinnerOnly) {
			this.cvs.text(this.screenInfo.center, "Imagine it's 1994...", "#fff", 40, "middle", "center", GS.UIFont);
		}
		else {
			this.cvs.box(this.loadingBox.topLeft, this.loadingBox.bottomRight, "#fff", 3);
			this.cvs.boxFill(this.loadingBox.contentTopLeft, this.loadingBox.contentCurrentBottomRight, "#fff");
		}

		this.cvs.flip();
	},

	updateProgress: function(e) {
		this.percentLoaded = e.percentLoaded;
	},

	updateLoadingBoxContent: function() {
		var width = this.loadingBox.contentBottomRight.x - this.loadingBox.contentTopLeft.x;
		this.loadingBox.contentCurrentBottomRight.x = this.loadingBox.contentTopLeft.x + Math.floor(width * this.percentLoaded * 0.01);

		this.redraw = true;
	},

	show: function() {
		this.cvs.show();
		this.hidden = false;
	},

	hide: function() {		
		this.cvs.hide();
		this.hidden = true;
	},

	computeScreenInfo: function() {
		this.screenInfo.width = GS.getViewportWidth();
		this.screenInfo.height = GS.getViewportHeight();
		this.screenInfo.center.set(Math.floor(this.screenInfo.width / 2), Math.floor(this.screenInfo.height / 2));

		this.loadingBox.topLeft.copy(this.screenInfo.center);
		this.loadingBox.topLeft.x -= Math.floor(this.loadingBox.width * 0.5 * this.screenInfo.width);
		this.loadingBox.topLeft.y -= Math.floor(this.loadingBox.height * 0.5 * this.screenInfo.height);

		this.loadingBox.bottomRight.copy(this.screenInfo.center);
		this.loadingBox.bottomRight.x += Math.floor(this.loadingBox.width * 0.5 * this.screenInfo.width);
		this.loadingBox.bottomRight.y += Math.floor(this.loadingBox.height * 0.5 * this.screenInfo.height);

		this.loadingBox.contentTopLeft.copy(this.loadingBox.topLeft);
		this.loadingBox.contentTopLeft.x += Math.floor(this.loadingBox.contentPadding * this.screenInfo.width);
		this.loadingBox.contentTopLeft.y += Math.floor(this.loadingBox.contentPadding * this.screenInfo.width);

		this.loadingBox.contentBottomRight.copy(this.loadingBox.bottomRight);
		this.loadingBox.contentBottomRight.x -= Math.floor(this.loadingBox.contentPadding * this.screenInfo.width);
		this.loadingBox.contentBottomRight.y -= Math.floor(this.loadingBox.contentPadding * this.screenInfo.width);

		this.loadingBox.contentCurrentBottomRight.y = this.loadingBox.contentBottomRight.y;

		this.updateLoadingBoxContent();
	},

	onResize: function() {
		this.computeScreenInfo();
	},

	set percentLoaded(value) {
		this._percentLoaded = value;
		this.updateLoadingBoxContent();
	},

	get percentLoaded() {
		return this._percentLoaded;
	},
};