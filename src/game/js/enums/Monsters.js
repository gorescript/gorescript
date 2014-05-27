GS.MonsterAttackTypes = {
	Melee: 0,
	Ranged: 1,
};

GS.Monsters = {
	nom: {
		size: new THREE.Vector3(16 * 0.45, 16 * 0.5,  16 * 0.45),
		scale: new THREE.Vector3(0.9, 0.9, 0.9),
		offset: new THREE.Vector3(16 * 0.45 * 0.5, 16 * 0.5 + 0.03, 16 * 0.45 * 0.5),
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