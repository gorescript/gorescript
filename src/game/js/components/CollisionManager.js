GS.CollisionTypes = {
	None: 0,
	Environment: 1,
	Entity: 2,
};

GS.CollisionManager = function(grid) {
	this.grid = grid;
	this.gravity = 1.33;
};

GS.CollisionManager.prototype = {
	init: function() {
	},

	collidePlayer: function() {
		var oldPosBeforeMove = new THREE.Vector3();

		return function(player, oldPos, newPos) {
			oldPosBeforeMove.copy(oldPos);

			this.collidePlayerEnvironment(player, oldPos, newPos);
			this.updateGridLocationEllipsoid(player, newPos);
			this.collidePlayerItems(player);
			this.updatePlayerUseTarget(player);

			this.grid.aiManager.onPlayerMove(player, oldPosBeforeMove, newPos);
		}
	}(),

	collidePlayerEnvironment: function() {
		var points = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];
		var points3d = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
		var velocityBoundingBox = new THREE.Box3();
		var types = [GS.Monster, GS.Concrete, GS.Door, GS.Elevator];

		return function(player, oldPos, newPos) {
			var lsp = player.view.collisionData.ellipsoid;

			points[0].set(oldPos.x + lsp.x, oldPos.z + lsp.z);
			points[1].set(oldPos.x - lsp.x, oldPos.z - lsp.z);
			points[2].set(newPos.x + lsp.x, newPos.z + lsp.z);
			points[3].set(newPos.x - lsp.x, newPos.z - lsp.z);

			var gridLocation = this.grid.getGridLocationFromPoints(points);

			points3d[0].copy(oldPos).sub(player.size);
			points3d[1].copy(oldPos).add(player.size);
			points3d[2].copy(newPos).sub(player.size);
			points3d[3].copy(newPos).add(player.size);

			velocityBoundingBox.setFromPoints(points3d);
			velocityBoundingBox.expandByScalar(this.gravity * 2);

			if (gridLocation === undefined) {
				return;
			}

			var triangleIterator = this.grid.getTriangleIterator(gridLocation, types, function(gridObject) {
				if (gridObject instanceof GS.Monster && gridObject.dead) {
					return false;
				}
				return gridObject.view.collisionData.boundingBox.isIntersectionBox(velocityBoundingBox);
			});

			var gravity = player.flyEnabled ? 0 : this.gravity;
			var result = GS.CollisionHelper.handleCollisionsSliding(oldPos, newPos, gravity, lsp, triangleIterator);
			player.afterCollision(result);
		}
	}(),	

	slidingBoxLineCollision: function() {
		var newPos0 = new THREE.Vector2();
		var aux = new THREE.Vector2();
		var slideVelocity = new THREE.Vector2();
		var epsilon = 0.005;

		return function(oldPos, newPos, box, lineSegmentIterator) {
			newPos0.copy(newPos);

			var k = 0;
			var foundCollision;

			while (k < 5) {
				foundCollision = false;

				lineSegmentIterator(function(seg) {
					GAME.grid.totalBoxSegmentChecks++;
					var result = box.isIntersectionLineSwept(oldPos, newPos0, seg);

					if (result.foundCollision) {
						foundCollision = true;

						aux.copy(newPos0).sub(result.pos);
						var m = -aux.dot(result.normal);

						slideVelocity.copy(aux);
						aux.copy(result.normal).multiplyScalar(m);
						slideVelocity.add(aux);

						aux.copy(result.pos).sub(newPos0).normalize().multiplyScalar(epsilon);
						result.pos.add(aux);
						
						newPos0.copy(result.pos).add(slideVelocity);
					}
				});

				if (!foundCollision) {
					break;
				}

				k++;
			}

			newPos.copy(newPos0);
		}
	}(),

	collidePlayerItems: function(player) {
		var that = this;
		this.grid.forEachUniqueGridObjectInCells(player.linkedGridCells, [GS.Item], function(item) {
			if (player.view.collisionData.boundingBox.isIntersectionBox(item.view.collisionData.boundingBox)) {
				player.onItemCollision(item);				
			}
		});
	},

	updatePlayerUseTarget: function(player) {
		var ray = new THREE.Ray();
		var position = new THREE.Vector3();
		var endPoint = new THREE.Vector3();
		var aux = new THREE.Vector3();
		var points = [ new THREE.Vector2(), new THREE.Vector2() ];
		var usableTypes = [GS.Door, GS.Switch];

		return function(player) {
			player.useTarget = null;

			position.copy(player.position);
			position.y += player.controls.eyeOffsetY;

			ray.set(position, player.direction);
			aux.copy(player.direction).multiplyScalar(player.useRange);
			endPoint.copy(position).add(aux);
			
			position.toVector2(points[0]);
			endPoint.toVector2(points[1]);

			var gridLocation = this.grid.getGridLocationFromPoints(points);
			if (gridLocation === undefined) {
				return;
			}

			var cells = this.grid.getCellsFromGridLocation(gridLocation);
			var minDist = Infinity;
			var minObject = null;
			this.grid.forEachUniqueGridObjectInCells(cells, usableTypes, function(gridObject) {
				if (ray.intersectsOrStartsInBox(gridObject.view.collisionData.boundingBox, aux) !== null) {
					var dist = aux.distanceTo(position);
					if (dist <= player.useRange && dist < minDist) {
						minDist = dist;
						minObject = gridObject;
					}
				}
			});

			player.useTarget = minObject;
			player.canUse = (minObject !== null && minObject.usable);
		}
	}(),

	checkMonsterLineOfSight: function() {
		var direction = new THREE.Vector3();
		var position = new THREE.Vector3();
		var typesEnvironment = [GS.Elevator, GS.Door, GS.Concrete];
		var typesEntity = [GS.Player];

		return function(monster, target, range) {
			position.copy(monster.position);
			direction.copy(target.position).sub(monster.position).normalize();

			var steps = Math.ceil(range / GS.HitscanHelper.unitLength);
			var result = GS.HitscanHelper.getIntersection(position, direction, this.grid, typesEnvironment, typesEntity, steps, monster);
			return (result.type === GS.CollisionTypes.Entity && result.gridObject === target);
		}
	}(),

	collideMonster: function(monster, oldPos, newPos) {
		this.collideMonsterPlayerEnvironment(monster, oldPos, newPos);
		this.updateGridLocationEllipsoid(monster, newPos);
	},

	collideMonsterPlayerEnvironment: function() {
		var points = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];
		var types = [GS.Player, GS.Monster];
		var aux = new THREE.Vector3();
		var velocity = new THREE.Vector2();
		var velocityBox = new THREE.Box2();

		return function(monster, oldPos, newPos) {
			var lsp = monster.view.collisionData.ellipsoid;

			points[0].set(oldPos.x + lsp.x, oldPos.z + lsp.z);
			points[1].set(oldPos.x - lsp.x, oldPos.z - lsp.z);
			points[2].set(newPos.x + lsp.x, newPos.z + lsp.z);
			points[3].set(newPos.x - lsp.x, newPos.z - lsp.z);

			var gridLocation = this.grid.getGridLocationFromPoints(points);

			if (gridLocation === undefined) {
				return;
			}

			this.handleConcreteCollisions(gridLocation, oldPos, newPos, monster.size);

			points[0].set(oldPos.x + lsp.x, oldPos.z + lsp.z);
			points[1].set(oldPos.x - lsp.x, oldPos.z - lsp.z);
			points[2].set(newPos.x + lsp.x, newPos.z + lsp.z);
			points[3].set(newPos.x - lsp.x, newPos.z - lsp.z);

			gridLocation = this.grid.getGridLocationFromPoints(points);

			if (gridLocation !== undefined) {
				var cells = this.grid.getCellsFromGridLocation(gridLocation);
				aux.subVectors(newPos, oldPos).toVector2(velocity);
				velocityBox.copy(monster.view.collisionData.boundingSquare);
				velocityBox.min.add(velocity);
				velocityBox.max.add(velocity);

				var foundCollision = false;
				var collisionGridObject = null;
				this.grid.forEachUniqueGridObjectInCells(cells, types, function(gridObject) {
					if (foundCollision || gridObject === monster || (gridObject instanceof GS.Monster && gridObject.dead)) {
						return;		
					}

					if (velocityBox.isIntersectionBox(gridObject.view.collisionData.boundingSquare)) {
						foundCollision = true;
						collisionGridObject = gridObject;
					}
				});

				if (!foundCollision) {
				} else {
					var y = newPos.y;
					newPos.copy(oldPos);
					newPos.y = y;
					if (collisionGridObject instanceof GS.Monster) {
						monster.scatter();
					}
				}
			}
		}
	}(),

	handleConcreteCollisions: function() {
		var oldPos2d = new THREE.Vector2();
		var newPos2d = new THREE.Vector2();
		var size2d = new THREE.Vector2();

		var box = new THREE.Box2();
		var boxNew = new THREE.Box2();

		return function(gridLocation, oldPos, newPos, size) {
			oldPos.toVector2(oldPos2d);
			newPos.toVector2(newPos2d);
			size.toVector2(size2d);

			box.min.copy(oldPos2d).sub(size2d);
			box.max.copy(oldPos2d).add(size2d);
			boxNew.min.copy(newPos2d).sub(size2d);
			boxNew.max.copy(newPos2d).add(size2d);

			var cells = this.grid.getCellsFromGridLocation(gridLocation);
			var newSector = this.getSectorHeights(cells, boxNew);

			var condition = function() { return true; };
			if (newSector !== undefined) {
				var currentHeight = newPos.y - size.y;
				var newHeight = newSector.floorHeight;

				if (Math.abs(newSector.ceilHeight - newSector.floorHeight) >= size.y * 2) {
					newPos.y = newHeight + size.y;
					var minHeight = newPos.y - size.y + 0.03;
					var maxHeight = newPos.y + size.y + 0.03;

					condition = function(seg) {
						return (seg.bottomY >= minHeight && seg.bottomY <= maxHeight ||
							seg.topY >= minHeight && seg.topY <= maxHeight ||
							seg.bottomY < minHeight && seg.topY > maxHeight);
					};
				}

				var segmentIterator = this.grid.getSegmentIterator(gridLocation, condition);
				this.slidingBoxLineCollision(oldPos2d, newPos2d, box, segmentIterator);

				newPos.x = newPos2d.x;
				newPos.z = newPos2d.y;
			} else {
				newPos.copy(oldPos);
			}
		}
	}(),

	getSectorHeights: function(cells, box) {
		var heights = [];

		var result = {
			floorHeight: -Infinity,
			ceilHeight: Infinity,
		};

		var sector = undefined;
		this.grid.forEachUniqueGridObjectInCells(cells, [GS.Concrete, GS.Elevator], function(gridObject) {
			if (gridObject instanceof GS.Concrete) {
				if (gridObject.type === GS.MapLayers.Sector) {
					sector = gridObject.sourceObj;
				} else {
					return;
				}
			} else {
				sector = gridObject.sector;
			}

			GAME.grid.totalBoxSectorChecks++;
			if (GS.PolygonHelper.intersectionSectorBox(sector, box)) {
				var floorHeight = sector.floorTopY;
				if (floorHeight > result.floorHeight) {					
					result.floorHeight = floorHeight;
					result.ceilHeight = (sector.ceiling === true) ? sector.ceilBottomY : Infinity;
				}
				heights.push(floorHeight);
			}
		});

		if (heights.length > 0) {
			heights.sort();

			var maxDistance = 0;
			var distance;
			for (var i = 0; i < heights.length - 1; i++) {
				distance = Math.abs(heights[i + 1] - heights[i]);
				if (distance > maxDistance) {
					maxDistance = distance;
				}
			}

			if (maxDistance <= 6) {
				return result;
			}
		}

		return undefined;
	},

	isEntityNearDoor: function(door, types) {
		types = types || [GS.Monster, GS.Player];

		var that = this;
		var collided = false;
		var doorBoundingBox = door.view.collisionData.boundingBox;

		this.grid.forEachUniqueGridObjectInCells(door.linkedGridCells, types, function(gridObject) {
			if (!collided) {
				if (!gridObject.dead && doorBoundingBox.isIntersectionBox(gridObject.view.collisionData.boundingBox)) {
					collided = true;
				}
			}
		});

		return collided;
	},

	elevatorMove: function() {
		var newPos = new THREE.Vector3();
		var pos2d = new THREE.Vector2();
		
		return function(elevator, velocity) {
			var types = [GS.Item];
			if (velocity > 0) {
				types.push(GS.Monster);
				types.push(GS.Player);
			}

			var that = this;
			var elevatorBoundingBox = elevator.view.collisionData.boundingBox;

			var boundingBox;
			this.grid.forEachUniqueGridObjectInCells(elevator.linkedGridCells, types, function(gridObject) {
				if (gridObject instanceof GS.Item) {
					if (gridObject.isStatic === true) {
						return;
					}
				}

				boundingBox = gridObject.view.collisionData.boundingBox;
				if (boundingBox.isIntersectionBox(elevatorBoundingBox)) {
					if (gridObject instanceof GS.Item) {
						if (gridObject.elevatorId !== undefined) {
							if (gridObject.elevatorId != elevator.id) {
								return;
							}
						} else {
							gridObject.position.toVector2(pos2d);
							if (GS.PolygonHelper.sectorContainsPoint(elevator.sector, pos2d, true)) {
								gridObject.elevatorId = elevator.id;
							} else {
								return;
							}
						}
					}

					newPos.copy(gridObject.position);
					newPos.y += velocity;
					gridObject.updateCollisionData(newPos);				
				}
			});
		}
	}(),

	collideProjectile: function() {
		var points = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];
		var normal = new THREE.Vector3();

		return function(projectile, oldPos, newPos) {
			var lsp = projectile.view.collisionData.ellipsoid;

			points[0].set(oldPos.x + lsp.x, oldPos.z + lsp.z);
			points[1].set(oldPos.x - lsp.x, oldPos.z - lsp.z);
			points[2].set(newPos.x + lsp.x, newPos.z + lsp.z);
			points[3].set(newPos.x - lsp.x, newPos.z - lsp.z);

			var gridLocation = this.grid.getGridLocationFromPoints(points);
			if (gridLocation === undefined) {
				return;
			}

			var result = {
				type: GS.CollisionTypes.None,
				pos: new THREE.Vector3(),
				gridObject: null,
				distance: Infinity,
				normal: new THREE.Vector3(),
			};

			this.collideProjectileEnvironment(projectile, gridLocation, oldPos, newPos, result);
			this.collideProjectileEntities(projectile, gridLocation, oldPos, newPos, result);

			if (result.type !== GS.CollisionTypes.None) {
				if (result.type === GS.CollisionTypes.Environment) {
					this.grid.addEnvironmentImpactParticles(result.pos, result.normal, projectile.color);
					result.gridObject.onHit();
				} else 
				if (result.type === GS.CollisionTypes.Entity) {
					if (result.gridObject.constructor === projectile.sourceGridObject.constructor) {
						normal.copy(result.pos).sub(projectile.position).normalize();
						this.grid.addEnvironmentImpactParticles(result.pos, normal, projectile.color);
					} else {
						this.grid.addEntityImpactParticles(result.pos, result.gridObject.bloodColor);
						result.gridObject.onHit(projectile.damage);
					}
				}
				
				projectile.updateCollisionData(result.pos);
				projectile.onHit();
			} else {
				projectile.updateCollisionData(newPos);
			}

			if (!projectile.removed) {
				this.updateGridLocationEllipsoid(projectile, newPos);
			}
		}
	}(),	

	collideProjectileEnvironment: function() {
		var points3d = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
		var velocityBoundingBox = new THREE.Box3();
		var types = [GS.Concrete, GS.Door, GS.Elevator];

		return function(projectile, gridLocation, oldPos, newPos, result) {
			var that = this;

			var lsp = projectile.view.collisionData.ellipsoid;			
			
			points3d[0].copy(oldPos).sub(projectile.size);
			points3d[1].copy(oldPos).add(projectile.size);
			points3d[2].copy(newPos).sub(projectile.size);
			points3d[3].copy(newPos).add(projectile.size);

			velocityBoundingBox.setFromPoints(points3d);

			var triangleIterator = this.grid.getTriangleIterator(gridLocation, types, function(gridObject) {
				return gridObject.view.collisionData.boundingBox.isIntersectionBox(velocityBoundingBox);
			});
			
			var triangleResult = GS.CollisionHelper.handleCollisionsFirstHit(oldPos, newPos, 0, lsp, triangleIterator);
			if (triangleResult.foundCollision) {
				var dist = oldPos.distanceToSquared(triangleResult.pos);

				if (dist < result.distance) {
					result.type = GS.CollisionTypes.Environment;
					result.pos.copy(triangleResult.pos);
					result.normal.copy(triangleResult.normal);
					result.distance = dist;
					result.gridObject = triangleResult.gridObject;	
				}
			}
		}
	}(),

	collideProjectileEntities: function() {
		var minPos = new THREE.Vector3();
		var collisionPoint = new THREE.Vector3();
		var types = [GS.Monster, GS.Player];

		return function(projectile, gridLocation, oldPos, newPos, result) {
			var that = this;
			var projectileBox = projectile.view.collisionData.boundingBox;
			var gridObjectBox;
			var cells = this.grid.getCellsFromGridLocation(gridLocation);

			this.grid.forEachUniqueGridObjectInCells(cells, types, function(gridObject) {				
				if (gridObject.dead || projectile.sourceGridObject === gridObject) {
					return;
				}

				gridObjectBox = gridObject.view.collisionData.boundingBox;

				if (projectileBox.isIntersectionBoxSwept(oldPos, newPos, gridObjectBox, gridObject.position, collisionPoint)) {
					var dist = oldPos.distanceToSquared(collisionPoint);

					if (dist < result.distance) {
						result.type = GS.CollisionTypes.Entity;
						result.pos.copy(collisionPoint);
						result.distance = dist;
						result.gridObject = gridObject;	
					}
				}
			});
		}
	}(),

	updateGridLocationEllipsoid: function() {
		var points = [ new THREE.Vector2(), new THREE.Vector2() ];

		return function(gridObject, newPos) {
			var lsp = gridObject.view.collisionData.ellipsoid;

			points[0].set(newPos.x + lsp.x, newPos.z + lsp.z);
			points[1].set(newPos.x - lsp.x, newPos.z - lsp.z);

			var gridLocation = this.grid.getGridLocationFromPoints(points);
			gridObject.assignToCells(gridLocation);
			gridObject.updateCollisionData(newPos);
		}
	}(),

	hitscan: function(sourceGridObject, projectileStart, weapon, xAngle, yAngle) {
		var that = this;
		var typesEnvironment = [GS.Concrete, GS.Door, GS.Elevator];
		var typesEntity = [];

		if (sourceGridObject instanceof GS.Player) {
			typesEntity.push(GS.Monster);
		}

		GS.HitscanHelper.spread(weapon, xAngle, yAngle, function(dir) {
			var result = GS.HitscanHelper.getIntersection(projectileStart, dir, that.grid, typesEnvironment, typesEntity);

			if (result.type === GS.CollisionTypes.Environment) {
				that.grid.addEnvironmentImpactParticles(result.pos, result.normal, 
					weapon.impactParticleColor, weapon.impactParticleCount);
				result.gridObject.onHit();
			} else
			if (result.type === GS.CollisionTypes.Entity) {
				that.grid.addEntityImpactParticles(result.pos, result.gridObject.bloodColor);
				result.gridObject.onHit(weapon.damage);
			}
		});
	},
};