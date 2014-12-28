GS.TexturePicker = function(domElement) {	
	this.$domElement = $(domElement);
	this.$container = $(domElement).parent();

	this.init();
};

GS.TexturePicker.prototype = {
	constructor: GS.TexturePicker,

	init: function() {
		var that = this;

		this.$domElement.hide();

		var canvas = document.createElement("canvas");

		canvas.width = 125;
		canvas.height = Math.floor(this.$container.height());
		canvas.style.backgroundColor = "rgba(255, 255, 255, 1)";
		canvas.style.border = "1px solid #AAAAAB";
		canvas.style.cursor = "pointer";
		this.canvas = canvas;
		this.$canvas = $(canvas);
		this.$container.append(canvas);

		var ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		ctx.fillStyle = "#fff";
		ctx.strokeStyle = "#000";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.miterLimit = 2;
		ctx.lineJoin = "circle";
		ctx.font = "18px 'Lucida Console', Monaco, monospace";
		ctx.save();		
		this.ctx = ctx;

		GS.TexturePopup.init();

		this.$canvas.on("click", function() {
			that.dispatchEvent({ type: "open" } );

			var value = that.$domElement.val();
			GS.TexturePopup.show(value, function(e) {
				that.$domElement.val(e.texId).trigger("change");
				that.draw();
				that.dispatchEvent({ type: "close" } );
			});
		});
		
		this.draw();
	},

	draw: function() {
		var texId = this.$domElement.val();

		if (texId !== undefined && texId !== "") {
			var img = GS.TexturePopup.getTex(texId);
			this.ctx.drawImage(img, 0, 0);

			this.ctx.lineWidth = 4;
			this.ctx.strokeText(texId, this.canvas.width / 2, this.canvas.height / 2);
			this.ctx.lineWidth = 1;
			this.ctx.fillText(texId, this.canvas.width / 2, this.canvas.height / 2);
		} else {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	},
};

THREE.EventDispatcher.prototype.apply(GS.TexturePicker.prototype);

GS.TexturePopup = {
	init: function() {
		if (this.initialized) {
			return;
		}

		this.$popupDiv = $("#texture-popup");
		if (this.$popupDiv.length === 0) {
			$(document.body).append(this.getHtml());
			this.$popupDiv = $("#texture-popup");
		}

		$(".map-texture-radio:first", this.$popupDiv).prop("checked", true);

		this.initialized = true;
	},

	getTex: function(texId) {
		return $("img[name='" + texId + "']", this.$popupDiv)[0];
	},

	getHtml: function() {
		var texPath = "../game/assets/textures/";
		var html = ["<div id='texture-popup' class='mfp-hide' style='background-color: #808080;'>"];

		var textures = GS.Assets[GS.AssetTypes.Texture];
		for (var i in textures) {
			var tex = textures[i];
			if (tex.type === GS.TextureTypes.Map || (tex.type === GS.TextureTypes.TVScreen && tex.showInMapEditor)) {
				html.push("<label class='map-texture-label' for='tex-id-" + i + "'>");
					html.push("<input type='radio' class='map-texture-radio' id='tex-id-" + i + "' name='map-texture-label' value='" + i + "'>");
					html.push("<img class='map-texture-img' name='" + i + "' src='" + texPath + tex.filename + "' title='" + i + "'>");
				html.push("</label>");
			}
		}

		html.push("</div>");

		return html.join("\n");
	},

	show: function(texId, callback) {
		if (texId !== undefined && texId !== "") {
			$(".map-texture-radio[id='tex-id-" + texId + "']", this.$popupDiv).prop("checked", true);
		}

		$.magnificPopup.open({
			items: {
				src: "#texture-popup",
				type: "inline",				
			},
			closeOnBgClick: false,
			callbacks: {
				close: function() {
					var newTexId = texId;
					var elem = $(".map-texture-radio:checked", this.$popupDiv);
					if (elem.length > 0) {
						newTexId = elem.val();
					}

					callback({ texId: newTexId });
				}
			}
		});		
	},
};