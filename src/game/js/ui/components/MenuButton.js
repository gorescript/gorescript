GS.UIComponents.MenuButton = function(vectorCanvas, text, offset, pos, size, onClick, states) {
	this.cvs = vectorCanvas;

	this.fontSize = 40;
	this.text = text;
	this.textBaseline = "middle";
	this.textAlign = "center";

	this.offset = offset;
	this.pos = pos;
	this.size = size;
	this.borderRadius = 10;

	this.onClick = onClick || function() {};
	this.states = states;
	this._currentStateIndex = 0;

	this.min = new THREE.Vector2();
	this.max = new THREE.Vector2();

	this.textOffset = this.offset.clone().add(this.size.clone().multiplyScalar(0.5));
	this.hover = false;
	this.active = false;
	this.disabled = false;

	this.backgroundColor = GS.UIColors.buttonHover;
	this.foregroundColor = GS.UIColors.foregroundDisabled;

	this.$canvas = $("canvas");
};

GS.UIComponents.MenuButton.prototype = {
	constructor: GS.UIComponents.MenuButton,

	init: function() {
	},

	update: function() {
		var mx = GS.InputHelper.mouseX;
		var my = GS.InputHelper.mouseY;

		this.cvs.convertToScreenCoords(this.pos, this.min, this.offset);
		this.max.copy(this.min).add(this.size);

		if (!this.disabled) {
			this.foregroundColor = GS.UIColors.foreground;

			if (mx >= this.min.x && my >= this.min.y && mx < this.max.x && my < this.max.y) {
				this.hover = true;
				// this.$canvas.css("cursor", "pointer");
				this.backgroundColor = GS.UIColors.buttonHover;
			} else {
				// this.$canvas.css("cursor", "default");
				this.hover = false;
			}

			if (this.hover) {
				if (GS.InputHelper.leftMouseDown) {
					this.active = true;
					this.backgroundColor = GS.UIColors.buttonActive;
				} else {
					if (this.active) {						
						// this.$canvas.css("cursor", "default");
						if (this.states !== undefined) {
							this._currentStateIndex++;
							if (this._currentStateIndex >= this.states.length) {
								this._currentStateIndex = 0;
							}

							this.text = this.states[this._currentStateIndex];
							this.onClick({ state: this.text });
						} else {
							this.onClick();
						}

						this.active = false;
						this.backgroundColor = GS.UIColors.buttonHover;
					}
				}
			}
		} else {
			this.foregroundColor = GS.UIColors.foregroundDisabled;
		}
	},

	draw: function() {
		if (!this.disabled && this.hover) {
			this.cvs.roundedBoxFill(this.offset, this.pos, this.size, true, this.borderRadius, this.backgroundColor);
		}

		this.cvs.text(this.textOffset, this.pos, this.text, this.foregroundColor, this.fontSize, this.textBaseline, this.textAlign, GS.UIFont);
	},

	set currentStateIndex(value) {
		if (this.states !== undefined) {
			if (value >= 0 && value < this.states.length) {
				this._currentStateIndex = value;
				this.text = this.states[this._currentStateIndex];
			}
		}
	},

	get currentStateIndex() {
		return this._currentStateIndex;
	},
};