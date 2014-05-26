GS.MonsterAttackTypes = {
	Melee: 0,
	Ranged: 1,
};

GS.Monsters = {
	nom: {
		size: new THREE.Vector3(16 * 0.4, 16 * 0.5,  16 * 0.4),
		scale: new THREE.Vector3(0.9, 0.9, 0.9),
		offset: new THREE.Vector3(3.2, 16 * 0.5 + 0.03, 3.2),
		speed: 0.75,
		rotationOffset: Math.PI,
		painChance: 0.25,
		attackType: GS.MonsterAttackTypes.Melee,
		maxHealth: 160,
		meleeDamage: 10,
		meleeAttackMaxCooldown: GS.msToFrames(500),
		meleeRange: 15,
	},
};