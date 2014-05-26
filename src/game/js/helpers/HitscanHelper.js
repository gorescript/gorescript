GS.HitscanHelper = {
	unitLength: 64,
	steps: 5,

	spread: function(weapon, xAngle, yAngle, callback) {
		var angleForX = weapon.spread.angleOffset + 20 * (Math.abs(yAngle - 90) / 90) * (Math.abs(yAngle - 90) / 90);
		var angleForY = weapon.spread.angleOffset;
		
		for (var i = 0; i < weapon.spread.shots; i++) {
			var xAngleOffset = xAngle + Math.random() * angleForX * 2 - angleForX;
			var yAngleOffset = yAngle + Math.random() * angleForY * 2 - angleForY;

			var x = Math.sin(Math.PI / 180 * yAngleOffset) * Math.cos(Math.PI / 180 * xAngleOffset);
			var y = Math.cos(Math.PI / 180 * yAngleOffset);
			var z = Math.sin(Math.PI / 180 * yAngleOffset) * Math.sin(Math.PI / 180 * xAngleOffset);

			var dir = new THREE.Vector3(x, y, z);
			dir.normalize();

			callback(dir);
		}
	},

	getIntersection: function() {
		var newPos = new THREE.Vector3();
		var step = new THREE.Vector3();
		var endPoint = new THREE.Vector3();
		var points = [ new THREE.Vector2(), new THREE.Vector2() ];
		var ray = new THREE.Ray();
		var point = new THREE.Vector3();

		return function(pos, dir, grid, typesEnvironment, typesEntity, steps, except) {
			steps = steps || this.steps;
			newPos.copy(pos);
			step.copy(dir).multiplyScalar(this.unitLength);

			var result = {
				type: GS.CollisionTypes.None,
				pos: new THREE.Vector3(),
				gridObject: null,
				distance: Infinity,
				normal: new THREE.Vector3(),
			};

			ray.set(pos, dir);

			for (var i = 0; i < steps; i++) {
				endPoint.copy(newPos).add(step);
				
				newPos.toVector2(points[0]);
				endPoint.toVector2(points[1]);

				var gridLocation = grid.getGridLocationFromPoints(points);
				if (gridLocation === undefined) {
					break;
				}

				this.checkEnvironmentIntersection(ray, grid, gridLocation, typesEnvironment, result, except);
				this.checkEntityIntersection(ray, grid, gridLocation, typesEntity, result, except);

				if (result.type !== GS.CollisionTypes.None) {
					break;
				} else {
					newPos.add(step);
				}
			}

			return result;
		}
	}(),

	checkEnvironmentIntersection: function() {
		var aux = new THREE.Vector3();
		var point = new THREE.Vector3();

		return function(ray, grid, gridLocation, types, result, except) {
			var triangleIterator = grid.getTriangleIterator(gridLocation, types);

			triangleIterator(function(gridObject, v0, v1, v2) {
				if (gridObject === except) {
					return;
				}

				if (ray.intersectTriangle(v0, v1, v2, true, point) !== null) {
					var dist = point.distanceToSquared(ray.origin);

					if (dist < result.distance) {
						result.type = GS.CollisionTypes.Environment;

						aux.subVectors(v2, v0);
						result.normal.copy(v1).sub(v0).cross(aux).normalize();

						result.pos.copy(point).add(result.normal);
						result.distance = dist;
						result.gridObject = gridObject;
					}
				}
			});
		}
	}(),

	checkEntityIntersection: function() {
		var point = new THREE.Vector3();

		return function(ray, grid, gridLocation, types, result, except) {
			var cells = grid.getCellsFromGridLocation(gridLocation);
		
			grid.forEachUniqueGridObjectInCells(cells, types, function(gridObject) {
				if (gridObject.dead || gridObject === except) {
					return;
				}

				if (ray.intersectBox(gridObject.view.collisionData.boundingBox, point) !== null) {
					var dist = point.distanceToSquared(ray.origin);

					if (dist < result.distance) {
						result.type = GS.CollisionTypes.Entity;

						result.pos.copy(point);
						result.distance = dist;
						result.gridObject = gridObject;
					}
				}
			});
		}
	}(),
};