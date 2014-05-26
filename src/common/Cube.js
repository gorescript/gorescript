GS.Cube = {
	getVertices: function() {
		var vertices = [
			// pos x
			new THREE.Vector3(1, 1, -1),
			new THREE.Vector3(1, 1, 1),
			new THREE.Vector3(1, -1, -1),
			new THREE.Vector3(1, 1, 1),
			new THREE.Vector3(1, -1, 1),
			new THREE.Vector3(1, -1, -1),

			// neg x
			new THREE.Vector3(-1, 1, 1),
			new THREE.Vector3(-1, 1, -1),
			new THREE.Vector3(-1, -1, 1),
			new THREE.Vector3(-1, 1, -1),
			new THREE.Vector3(-1, -1, -1),
			new THREE.Vector3(-1, -1, 1),

			// pos y
			new THREE.Vector3(-1, 1, 1),
			new THREE.Vector3(1, 1, 1),
			new THREE.Vector3(-1, 1, -1),
			new THREE.Vector3(1, 1, 1),
			new THREE.Vector3(1, 1, -1),
			new THREE.Vector3(-1, 1, -1),

			// neg y
			new THREE.Vector3(-1, -1, -1),
			new THREE.Vector3(1, -1, -1),
			new THREE.Vector3(-1, -1, 1),
			new THREE.Vector3(1, -1, -1),
			new THREE.Vector3(1, -1, 1),
			new THREE.Vector3(-1, -1, 1),

			// pos z
			new THREE.Vector3(1, 1, 1),
			new THREE.Vector3(-1, 1, 1),
			new THREE.Vector3(1, -1, 1),
			new THREE.Vector3(-1, 1, 1),
			new THREE.Vector3(-1, -1, 1),
			new THREE.Vector3(1, -1, 1),

			// neg z
			new THREE.Vector3(-1, 1, -1),
			new THREE.Vector3(1, 1, -1),
			new THREE.Vector3(-1, -1, -1),
			new THREE.Vector3(1, 1, -1),
			new THREE.Vector3(1, -1, -1),
			new THREE.Vector3(-1, -1, -1),
		];

		return vertices;
	},
};