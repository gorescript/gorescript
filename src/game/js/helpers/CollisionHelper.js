// Sliding Camera Collision Detection
// http://www.braynzarsoft.net/index.php?p=D3D11SlidingCamera

GS.CollisionHelper = {
	gravity: new THREE.Vector3(0, -1.5, 0),
	unitsPerMeter: 100,

	handleCollisionsSliding: function(oldPos, newPos, gravityFactor, ellipsoid, triangleIterator) {
		return this.handleCollisions(oldPos, newPos, gravityFactor, ellipsoid, triangleIterator, false, false);
	},

	handleCollisionsFirstHit: function(oldPos, newPos, gravityFactor, ellipsoid, triangleIterator) {
		return this.handleCollisions(oldPos, newPos, gravityFactor, ellipsoid, triangleIterator, true, false);
	},

	handleCollisions: function() {
		var p = {
			ellipsoidSpace: new THREE.Vector3(),
			worldPosition: new THREE.Vector3(),
			worldVelocity: new THREE.Vector3(),

			lspPosition: new THREE.Vector3(),
			lspVelocity: new THREE.Vector3(),
			lspNormalizedVelocity: new THREE.Vector3(),
			normal: new THREE.Vector3(),

			foundCollision: false,
			nearestDistance: 0,
			intersectionPoint: new THREE.Vector3(),
			collisionRecursionDepth: 0,
			stopOnFirstHit: false,

			gravityFactor: 0,
		};

		return function(oldPos, newPos, gravityFactor, ellipsoid, triangleIterator, stopOnFirstHit, horizontalOnly) {
			p.ellipsoidSpace.copy(ellipsoid);
			p.worldPosition.copy(oldPos);
			p.worldVelocity.subVectors(newPos, oldPos);

			p.foundCollision = false;
			p.nearestDistance = 0;
			p.collisionRecursionDepth = 0;
			p.stopOnFirstHit = stopOnFirstHit;
			p.gravityFactor = gravityFactor;

			var result = this.collisionSlide(p, triangleIterator);
			newPos.copy(result.pos);

			return result;
		}
	}(),

	collisionSlide: function(p, triangleIterator) {
		p.lspVelocity.copy(p.worldVelocity).divide(p.ellipsoidSpace);
		p.lspPosition.copy(p.worldPosition).divide(p.ellipsoidSpace);
		var oldY = p.lspPosition.y;

		p.collisionRecursionDepth = 0;
		var finalPosition = this.collideWithWorld(p, triangleIterator);
		var climbing = (oldY < finalPosition.y);

		if (p.gravityFactor != 0 && !climbing && !p.horizontalOnly) {
			p.lspVelocity.copy(this.gravity);
			p.lspVelocity.y *= p.gravityFactor;
			p.lspVelocity.divide(p.ellipsoidSpace);
			p.lspPosition.copy(finalPosition);
			p.collisionRecursionDepth = 0;
			finalPosition = this.collideWithWorld(p, triangleIterator);
		}

		finalPosition.multiply(p.ellipsoidSpace);

		if (p.horizontalOnly) {
			finalPosition.y = p.originalHeight;
		}

		var result = { 
			pos: finalPosition,
			climbing: climbing,
			foundCollision: p.foundCollision,
			gridObject: p.gridObject,
			normal: p.normal,
		};

		return result;
	},

	collideWithWorld: function() {
		var normal = new THREE.Vector3();
		var aux = new THREE.Vector3();
		var result = new THREE.Vector3();
		var destinationPoint = new THREE.Vector3();
		var newPosition = new THREE.Vector3();
		var slidePlaneOrigin = new THREE.Vector3();
		var slidePlaneNormal = new THREE.Vector3();
		var newDestinationPoint = new THREE.Vector3();
		var newVelocityVector = new THREE.Vector3();
		var v0 = new THREE.Vector3();
		var v1 = new THREE.Vector3();
		var v2 = new THREE.Vector3();

		return function(p, triangleIterator) {
			var that = this;

			var unitScale = this.unitsPerMeter / 100;
			var veryCloseDistance = 0.005 * unitScale;

			if (p.collisionRecursionDepth > 5) {
				return p.lspPosition;
			}

			p.lspNormalizedVelocity.copy(p.lspVelocity).normalize();

			p.foundCollision = false;
			p.nearestDistance = 0;

			triangleIterator(function(gridObject, t0, t1, t2, triangleOffset) {
				GAME.grid.totalSphereTriangleChecks++;
				
				v0.copy(t0).divide(p.ellipsoidSpace);
				v1.copy(t1).divide(p.ellipsoidSpace);
				v2.copy(t2).divide(p.ellipsoidSpace);

				aux.subVectors(v2, v0);
				normal.copy(v1).sub(v0).cross(aux).normalize();

				that.sphereCollidingWithTriangle(gridObject, p, v0, v1, v2, normal);
			});

			if (!p.foundCollision) {
				result.copy(p.lspPosition).add(p.lspVelocity);
				return result;
			}

			destinationPoint.copy(p.lspPosition).add(p.lspVelocity);
			newPosition.copy(p.lspPosition);

			if (p.nearestDistance >= veryCloseDistance) {
				aux.copy(p.lspVelocity).normalize();
				aux.multiplyScalar(p.nearestDistance - veryCloseDistance);
				newPosition.copy(p.lspPosition).add(aux);

				aux.normalize().multiplyScalar(veryCloseDistance);
				p.intersectionPoint.sub(aux);
			}

			if (!p.stopOnFirstHit) {
				slidePlaneOrigin.copy(p.intersectionPoint);
				slidePlaneNormal.copy(newPosition).sub(p.intersectionPoint).normalize();

				var x = slidePlaneOrigin.x;
				var y = slidePlaneOrigin.y;
				var z = slidePlaneOrigin.z;

				var A = slidePlaneNormal.x;
				var B = slidePlaneNormal.y;
				var C = slidePlaneNormal.z;
				var D = -((A * x) + (B * y) + (C * z));

				var planeConstant = D;

				var signedDistFromDestPointToSlidingPlane = slidePlaneNormal.dot(destinationPoint) + planeConstant;

				aux.copy(slidePlaneNormal).multiplyScalar(signedDistFromDestPointToSlidingPlane);
				newDestinationPoint.copy(destinationPoint).sub(aux);
				newVelocityVector.copy(newDestinationPoint).sub(p.intersectionPoint);

				if (newVelocityVector.length() < veryCloseDistance) {
					return newPosition;
				}

				p.collisionRecursionDepth++;
				p.lspPosition.copy(newPosition);
				p.lspVelocity.copy(newVelocityVector);

				return this.collideWithWorld(p, triangleIterator);
			} else {
				p.lspPosition.copy(newPosition);
				return p.lspPosition;
			}
		}
	}(),

	sphereCollidingWithTriangle: function() {
		var velocity = new THREE.Vector3();
		var position = new THREE.Vector3();
		var aux = new THREE.Vector3();
		var planeIntersectionPoint = new THREE.Vector3();
		var collisionPoint = new THREE.Vector3();
		var edge = new THREE.Vector3();
		var spherePositionToVertex = new THREE.Vector3();

		return function(gridObject, p, v0, v1, v2, normal) {
			var facing = normal.dot(p.lspNormalizedVelocity);			
			if (facing <= 0) {
				velocity.copy(p.lspVelocity);
				position.copy(p.lspPosition);

				var t0, t1;
				var sphereInPlane = false;

				var A = normal.x;
				var B = normal.y;
				var C = normal.z;
				var D = -((A * v0.x) + (B * v0.y) + (C * v0.z));

				var planeConstant = D;

				var signedDistFromPositionToTriPlane = position.dot(normal) + planeConstant;
				var planeNormalDotVelocity = normal.dot(velocity);

				if (planeNormalDotVelocity == 0) {
					if (Math.abs(signedDistFromPositionToTriPlane) >= 1) {
						return false;
					} else {
						sphereInPlane = true;
					}
				} else {
					t0 = (1 - signedDistFromPositionToTriPlane) / planeNormalDotVelocity;
					t1 = (-1 - signedDistFromPositionToTriPlane) / planeNormalDotVelocity;

					if (t0 > t1) {
						var temp = t0;
						t0 = t1;
						t1 = temp;
					}

					if (t0 > 1 || t1 < 0) {
						return false;
					}

					if (t0 < 0) {
						t0 = 0;
					}
					if (t1 > 1) {
						t1 = 1;
					}
				}

				var collidingWithTri = false;
				var t = 1;

				if (!sphereInPlane) {
					aux.copy(velocity).multiplyScalar(t0);
					planeIntersectionPoint.copy(position).add(aux).sub(normal);

					if (this.checkPointInTriangle(planeIntersectionPoint, v0, v1, v2)) {
						collidingWithTri = true;
						t = t0;
						collisionPoint.copy(planeIntersectionPoint);
					}
				}

				if (!collidingWithTri) {
					var a, b, c;
					var velocityLengthSquared = velocity.lengthSq();
					a = velocityLengthSquared;
					var result = {};

					aux.copy(position).sub(v0);
					b = 2 * velocity.dot(aux);
					aux.copy(v0).sub(position);
					c = aux.length();
					c = c * c - 1;
					if (this.getLowestRoot(a, b, c, t, result)) {
						t = result.root;
						collidingWithTri = true;
						collisionPoint.copy(v0);
					}

					aux.copy(position).sub(v1);
					b = 2 * velocity.dot(aux);
					aux.copy(v1).sub(position);
					c = aux.length();
					c = c * c - 1;
					if (this.getLowestRoot(a, b, c, t, result)) {
						t = result.root;
						collidingWithTri = true;
						collisionPoint.copy(v1);
					}

					aux.copy(position).sub(v2);
					b = 2 * velocity.dot(aux);
					aux.copy(v2).sub(position);
					c = aux.length();
					c = c * c - 1;
					if (this.getLowestRoot(a, b, c, t, result)) {
						t = result.root;
						collidingWithTri = true;
						collisionPoint.copy(v2);
					}

					edge.copy(v1).sub(v0);
					spherePositionToVertex.copy(v0).sub(position);
					var edgeLengthSquared = edge.lengthSq();
					var edgeDotVelocity = edge.dot(velocity);
					var edgeDotSpherePositionToVertex = edge.dot(spherePositionToVertex);
					var spherePositionToVertexLengthSquared = spherePositionToVertex.lengthSq();

					a = edgeLengthSquared * -velocityLengthSquared + (edgeDotVelocity * edgeDotVelocity);
					b = edgeLengthSquared * 2 * velocity.dot(spherePositionToVertex) - 2 * edgeDotVelocity * edgeDotSpherePositionToVertex;
					c = edgeLengthSquared * (1 - spherePositionToVertexLengthSquared) + 
						(edgeDotSpherePositionToVertex * edgeDotSpherePositionToVertex);

					if (this.getLowestRoot(a, b, c, t, result)) {
						var f = (edgeDotVelocity * result.root - edgeDotSpherePositionToVertex) / edgeLengthSquared;
						if (f >= 0 && f <= 1) {
							t = result.root;
							collidingWithTri = true;
							edge.multiplyScalar(f);
							collisionPoint.copy(v0).add(edge);
						}
					}

					edge.copy(v2).sub(v1);
					spherePositionToVertex.copy(v1).sub(position);
					edgeLengthSquared = edge.lengthSq();
					edgeDotVelocity = edge.dot(velocity);
					edgeDotSpherePositionToVertex = edge.dot(spherePositionToVertex);
					spherePositionToVertexLengthSquared = spherePositionToVertex.lengthSq();

					a = edgeLengthSquared * -velocityLengthSquared + (edgeDotVelocity * edgeDotVelocity);
					b = edgeLengthSquared * 2 * velocity.dot(spherePositionToVertex) - 2 * edgeDotVelocity * edgeDotSpherePositionToVertex;
					c = edgeLengthSquared * (1 - spherePositionToVertexLengthSquared) + 
						(edgeDotSpherePositionToVertex * edgeDotSpherePositionToVertex);

					if (this.getLowestRoot(a, b, c, t, result)) {
						var f = (edgeDotVelocity * result.root - edgeDotSpherePositionToVertex) / edgeLengthSquared;
						if (f >= 0 && f <= 1) {
							t = result.root;
							collidingWithTri = true;
							edge.multiplyScalar(f);
							collisionPoint.copy(v1).add(edge);
						}
					}

					edge.copy(v0).sub(v2);
					spherePositionToVertex.copy(v2).sub(position);
					edgeLengthSquared = edge.lengthSq();
					edgeDotVelocity = edge.dot(velocity);
					edgeDotSpherePositionToVertex = edge.dot(spherePositionToVertex);
					spherePositionToVertexLengthSquared = spherePositionToVertex.lengthSq();

					a = edgeLengthSquared * -velocityLengthSquared + (edgeDotVelocity * edgeDotVelocity);
					b = edgeLengthSquared * 2 * velocity.dot(spherePositionToVertex) - 2 * edgeDotVelocity * edgeDotSpherePositionToVertex;
					c = edgeLengthSquared * (1 - spherePositionToVertexLengthSquared) + 
						(edgeDotSpherePositionToVertex * edgeDotSpherePositionToVertex);

					if (this.getLowestRoot(a, b, c, t, result)) {
						var f = (edgeDotVelocity * result.root - edgeDotSpherePositionToVertex) / edgeLengthSquared;
						if (f >= 0 && f <= 1) {
							t = result.root;
							collidingWithTri = true;
							edge.multiplyScalar(f);
							collisionPoint.copy(v2).add(edge);
						}
					}
				}

				if (collidingWithTri) {
					var distToCollision = t * velocity.length();
					if (!p.foundCollision || distToCollision < p.nearestDistance) {
						p.nearestDistance = distToCollision;
						p.intersectionPoint.copy(collisionPoint);
						p.foundCollision = true;
						p.normal.copy(normal);
						p.gridObject = gridObject;

						return true;
					}
				}
			}

			return false;
		}
	}(),

	checkPointInTriangle: function() {
		var cp1 = new THREE.Vector3();
		var cp2 = new THREE.Vector3();
		var aux = new THREE.Vector3();
		var aux2 = new THREE.Vector3();

		return function(point, v1, v2, v3) {
			aux.copy(v3).sub(v2);
			aux2.copy(point).sub(v2);
			cp1.crossVectors(aux, aux2);

			aux.copy(v3).sub(v2);
			aux2.copy(v1).sub(v2);
			cp2.crossVectors(aux, aux2);

			if (cp1.dot(cp2) >= 0) {
				aux.copy(v3).sub(v1);
				aux2.copy(point).sub(v1);
				cp1.crossVectors(aux, aux2);

				aux.copy(v3).sub(v1);
				aux2.copy(v2).sub(v1);
				cp2.crossVectors(aux, aux2);

				if (cp1.dot(cp2) >= 0) {
					aux.copy(v2).sub(v1);
					aux2.copy(point).sub(v1);
					cp1.crossVectors(aux, aux2);

					aux.copy(v2).sub(v1);
					aux2.copy(v3).sub(v1);
					cp2.crossVectors(aux, aux2);

					if (cp1.dot(cp2) >= 0) {
						return true;
					}
				}
			}
		}
	}(),

	getLowestRoot: function(a, b, c, maxR, result) {
		var determinant = b * b - 4 * a * c;
		if (determinant < 0) {
			return false;
		}

		var sqrtD = Math.sqrt(determinant);
		var r1 = (-b - sqrtD) / (2 * a);
		var r2 = (-b + sqrtD) / (2 * a);

		if (r1 > r2) {
			var temp = r2;
			r2 = r1;
			r1 = temp;
		}

		if (r1 > 0 && r1 < maxR) {
			result.root = r1;
			return true;
		}

		if (r2 > 0 && r2 < maxR) {
			result.root = r2;
			return true;
		}

		return false;
	},
};