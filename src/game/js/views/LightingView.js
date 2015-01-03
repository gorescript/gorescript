GS.LightingView = function(grid) {
	this.grid = grid;
	this.player = grid.player;

	this.worldScene = grid.scene;
	this.playerScene = grid.player.playerView.scene;

	this.ambientColor = new THREE.Color().setRGB(0, 0, 0);

	this.directionalColor = new THREE.Color().setRGB(1, 1, 1).getHex();
	this.directionalPosition = new THREE.Vector3(1, 1, 1);
	this.directionalIntensity = 0;

	this.muzzleFlashPosition = new THREE.Vector3(0, -3, -12);
	this.muzzleFlashDistance = 256;
	this.muzzleFlashMaxIntensity = 1;
	this.muzzleFlashIntensity = new GS.SmoothNumber(0, 0.1);

	this.projectileIntensity = 1;
	this.projectileDistance = 32;
	this.maxProjectilePointLights = 10;

	this.playerTorchDistance = 256;
	this.playerTorchIntensity = 0.5;
	this.playerTorchColor = new THREE.Color().setRGB(1, 1, 1);

	this.worldLights = {};
	this.playerLights = {};
	this.projectileLights = [];
};

GS.LightingView.prototype = {
	init: function() {
		this.initWorldLights();
		this.initPlayerLights();
	},

	initWorldLights: function() {
		var ambientLight = new THREE.AmbientLight(this.ambientColor);
		this.worldScene.add(ambientLight);
		this.worldLights.ambient = ambientLight;

		var pointLight = new THREE.PointLight();
		pointLight.intensity = this.muzzleFlashIntensity.value;
		pointLight.distance = this.muzzleFlashDistance;
		this.worldScene.add(pointLight);
		this.worldLights.muzzleFlash = pointLight;		

		var dirLight = new THREE.DirectionalLight(this.directionalColor, this.directionalIntensity);
		dirLight.position.copy(this.directionalPosition);
		this.worldScene.add(dirLight);
		this.worldLights.directional = dirLight;

		for (var i = 0; i < this.maxProjectilePointLights; i++) {
			var pointLight = new THREE.PointLight();
			pointLight.intensity = 0;
			pointLight.distance = this.projectileDistance;

			var light = {
				active: false,
				pointLight: pointLight,
				intensity: new GS.SmoothNumber(this.projectileIntensity, 0.1),
			};

			this.worldScene.add(pointLight);
			this.projectileLights.push(light);
		}

		var playerTorch = new THREE.PointLight();
		playerTorch.color.copy(this.playerTorchColor);
		playerTorch.intensity = this.playerTorchIntensity;
		playerTorch.distance = this.playerTorchDistance;
		this.worldScene.add(playerTorch);
		this.worldLights.playerTorch = playerTorch;

		var playerSceneTorch = new THREE.PointLight();
		playerSceneTorch.color.copy(this.playerTorchColor);
		playerSceneTorch.intensity = this.playerTorchIntensity;
		playerSceneTorch.distance = this.playerTorchDistance;
		this.playerScene.add(playerSceneTorch);
		this.playerLights.playerTorch = playerSceneTorch;
	},

	initPlayerLights: function() {
		var ambientLight = new THREE.AmbientLight(this.ambientColor);
		this.playerScene.add(ambientLight);
		this.playerLights.ambient = ambientLight;

		var pointLight = new THREE.PointLight();
		pointLight.position.copy(this.muzzleFlashPosition);
		pointLight.intensity = this.muzzleFlashIntensity.value;
		pointLight.distance = this.muzzleFlashDistance;
		this.playerScene.add(pointLight);
		this.playerLights.muzzleFlash = pointLight;
		
		var dirLight = new THREE.DirectionalLight(this.directionalColor, this.directionalIntensity);
		dirLight.position.copy(this.directionalPosition);
		this.playerScene.add(dirLight);
		this.playerLights.directional = dirLight;

		this.player.playerView.lightingView = this;
	},

	updatePlayerLights: function() {
		var xAngle = Math.PI / 180 * (this.player.yAngle - 90);
		var yAngle = Math.PI / 180 * (this.player.xAngle + 90);
		var matrix = new THREE.Matrix4().makeRotationX(xAngle).multiply(new THREE.Matrix4().makeRotationY(yAngle));
		var dirPos = this.worldLights.directional.position;
		this.playerLights.directional.position.copy(dirPos).applyMatrix4(matrix);

		this.muzzleFlashIntensity.update();
		this.worldLights.muzzleFlash.position.copy(this.player.position);
		this.worldLights.muzzleFlash.position.y += this.player.size.y * 0.5;
		this.worldLights.muzzleFlash.intensity = this.muzzleFlashIntensity.value;
		this.playerLights.muzzleFlash.intensity = this.muzzleFlashIntensity.value;		

		this.worldLights.playerTorch.position.copy(this.player.position);
	},

	beginMuzzleFlash: function(color) {
		this.muzzleFlashIntensity.value = this.muzzleFlashMaxIntensity;
		this.worldLights.muzzleFlash.color.copy(color);
		this.playerLights.muzzleFlash.color.copy(color);
	},

	endMuzzleFlash: function() {
		this.muzzleFlashIntensity.setTargetValue(0);
	},

	addProjectileLight: function(projectile) {
		var light;

		light = this.projectileLights.shift();

		light.active = true;
		light.projectile = projectile;
		light.intensity.value = this.projectileIntensity;
		light.intensity.setTargetValue(this.projectileIntensity);
		light.pointLight.color.setHex(projectile.color);
		light.pointLight.position.copy(projectile.position);
		light.pointLight.intensity = light.intensity.value;		
		
		this.projectileLights.push(light);
	},

	update: function() {
		for (var i = 0; i < this.projectileLights.length; i++) {
			var light = this.projectileLights[i];

			if (!light.active) {
				continue;
			}

			if (light.projectile.removed) {
				light.intensity.setTargetValue(0);
			}

			light.intensity.update();
			light.pointLight.intensity = light.intensity.value;
			light.pointLight.position.copy(light.projectile.position);

			if (light.intensity.value === 0) {
				light.active = false;
			}
		}
	},
};