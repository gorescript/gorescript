GS.AssetTypes = {
	Texture: 0,
	Mesh: 1,
	Sound: 2,
	CubeTexture: 3,
	UIWidget: 4,
	Map: 5,
	MusicTrack: 7,
};

GS.TextureTypes = {
	Map: 0,
	TVScreen: 1,
	Entity: 2,
}

GS.CubeTextureExtension = ".jpg";
GS.CubeTextureNames = [ "left", "right", "top", "bottom", "front", "back" ];
GS.CustomFontFile = "capsuula.woff";

GS.Assets = {};

GS.Assets[GS.AssetTypes.Texture] = {
	"cyan_wall":			{ filename: "cyan_wall.png",				type: GS.TextureTypes.Map },
	"red_wall": 			{ filename: "red_wall.png", 				type: GS.TextureTypes.Map },
	"blue_metal": 			{ filename: "blue_metal.png", 				type: GS.TextureTypes.Map },	
	"white": 				{ filename: "white.png",	 				type: GS.TextureTypes.Map },
	"wall": 				{ filename: "wall.png", 					type: GS.TextureTypes.Map },
	"metal": 				{ filename: "metal.png", 					type: GS.TextureTypes.Map },
	"light": 				{ filename: "light.png", 					type: GS.TextureTypes.Map },
	"red": 					{ filename: "red.png", 						type: GS.TextureTypes.Map },
	"blue": 				{ filename: "blue.png", 					type: GS.TextureTypes.Map },
	"cyan": 				{ filename: "cyan.png", 					type: GS.TextureTypes.Map },
	"brown": 				{ filename: "brown.png", 					type: GS.TextureTypes.Map },

	"exit": 				{ filename: "exit.png",						type: GS.TextureTypes.TVScreen, showInMapEditor: true },
	"switch_off": 			{ filename: "switch_off.png",				type: GS.TextureTypes.TVScreen },
	"switch_on": 			{ filename: "switch_on.png",				type: GS.TextureTypes.TVScreen },

	"ammo": 				{ filename: "ammo.png", 					type: GS.TextureTypes.Entity },
	"ammo_glow": 			{ filename: "ammo_glow.png", 				type: GS.TextureTypes.Entity },
	"medkit": 				{ filename: "medkit.png", 					type: GS.TextureTypes.Entity },
	"medkit_glow": 			{ filename: "medkit_glow.png", 				type: GS.TextureTypes.Entity },
	"pistol": 				{ filename: "pistol.png", 					type: GS.TextureTypes.Entity },
	"pistol_glow": 			{ filename: "pistol_glow.png", 				type: GS.TextureTypes.Entity },
	"double_shotgun": 		{ filename: "double_shotgun.png", 			type: GS.TextureTypes.Entity },
	"double_shotgun_glow": 	{ filename: "double_shotgun_glow.png", 		type: GS.TextureTypes.Entity },
	"hyper_blaster": 		{ filename: "hyper_blaster.png", 			type: GS.TextureTypes.Entity },
	"hyper_blaster_glow": 	{ filename: "hyper_blaster_glow.png", 		type: GS.TextureTypes.Entity },
	"nom": 					{ filename: "nom.png", 						type: GS.TextureTypes.Entity },
	"nom_glow": 			{ filename: "nom_glow.png", 				type: GS.TextureTypes.Entity },
	"eye": 					{ filename: "eye.png", 						type: GS.TextureTypes.Entity },
	"eye_glow": 			{ filename: "eye_glow.png", 				type: GS.TextureTypes.Entity },
};

GS.Assets[GS.AssetTypes.CubeTexture] = {
	"skybox1": 				{ filename: "skybox1" },
};

GS.Assets[GS.AssetTypes.UIWidget] = {
	"hud": 					{ filename: "hud.png" },
	"logo": 				{ filename: "logo.png" },
	"menu_back":			{ filename: "menu_back.png" },
	"thumb_airstrip1":		{ filename: "thumb_airstrip1.png" },
	"thumb_drencrom":		{ filename: "thumb_drencrom.png" },
	"thumb_sacrosanct":		{ filename: "thumb_sacrosanct.png" },
};

GS.Assets[GS.AssetTypes.Mesh] = {
	"ammo": 				{ filename: "ammo.js" },
	"medkit": 				{ filename: "medkit.js" },

	"pistol": 				{ filename: "pistol.js" },
	"double_shotgun": 		{ filename: "double_shotgun.js" },
	"hyper_blaster": 		{ filename: "hyper_blaster.js" },
	
	"nom_walk0": 			{ filename: "nom_walk0.js" },
	"nom_walk1": 			{ filename: "nom_walk1.js" },
	"nom_walk2": 			{ filename: "nom_walk2.js" },
	"nom_walk3": 			{ filename: "nom_walk3.js" },
	"nom_walk4": 			{ filename: "nom_walk4.js" },
	"nom_walk5": 			{ filename: "nom_walk5.js" },
	"nom_death0": 			{ filename: "nom_death0.js" },
	"nom_death1": 			{ filename: "nom_death1.js" },
	"nom_death2": 			{ filename: "nom_death2.js" },
	"nom_death3": 			{ filename: "nom_death3.js" },

	"eye_walk0": 			{ filename: "eye_walk0.js" },
	"eye_walk1": 			{ filename: "eye_walk1.js" },
	"eye_walk2": 			{ filename: "eye_walk2.js" },
	"eye_walk3": 			{ filename: "eye_walk3.js" },
	"eye_death0": 			{ filename: "eye_death0.js" },
	"eye_death1": 			{ filename: "eye_death1.js" },
	"eye_death2": 			{ filename: "eye_death2.js" },
	"eye_death3": 			{ filename: "eye_death3.js" },
	"eye_attack0": 			{ filename: "eye_attack0.js" },
	"eye_attack1": 			{ filename: "eye_attack1.js" },
};

GS.Assets[GS.AssetTypes.Sound] = {
	"door_close": 			{ filename: "door_close.ogg",				allowMultipleAtOnce: true },
	"door_open": 			{ filename: "door_open.ogg",				allowMultipleAtOnce: true },
	"elevator_move": 		{ filename: "elevator_move.ogg",			allowMultipleAtOnce: true },
	"elevator_stop": 		{ filename: "elevator_stop.ogg",			allowMultipleAtOnce: true },
	"hyper_blaster_fire": 	{ filename: "hyper_blaster_fire.ogg",		allowMultipleAtOnce: true },
	"hyper_blaster_hit": 	{ filename: "hyper_blaster_hit.ogg",		allowMultipleAtOnce: true },
	"monster_pain": 		{ filename: "monster_pain.ogg",				allowMultipleAtOnce: false },
	"monster_roar": 		{ filename: "monster_roar.ogg",				allowMultipleAtOnce: true },
	"monster_bite": 		{ filename: "monster_bite.ogg",				allowMultipleAtOnce: true },
	"monster_death": 		{ filename: "monster_death.ogg",			allowMultipleAtOnce: true },
	"eye_charging": 		{ filename: "eye_charging.ogg",				allowMultipleAtOnce: true },
	"pickup_ammo": 			{ filename: "pickup_ammo.ogg",				allowMultipleAtOnce: true },
	"pickup_item": 			{ filename: "pickup_item.ogg",				allowMultipleAtOnce: true },
	"pickup_weapon": 		{ filename: "pickup_weapon.ogg",			allowMultipleAtOnce: true },
	"shotgun_fire": 		{ filename: "shotgun_fire.ogg",				allowMultipleAtOnce: true },
	"player_death": 		{ filename: "player_death.ogg",				allowMultipleAtOnce: true },
	"switch_on": 			{ filename: "switch_on.ogg",				allowMultipleAtOnce: true },
	"none": 				{ filename: "none.ogg",						allowMultipleAtOnce: true },
};

GS.Assets[GS.AssetTypes.MusicTrack] = {
	"simple_action_beat": 	{ filename: "simple_action_beat.ogg" },
	"tower_defense_theme": 	{ filename: "tower_defense_theme.ogg" },
	"angry_robot_3": 		{ filename: "angry_robot_3.ogg" },
};

GS.Assets[GS.AssetTypes.Map] = {
	"airstrip1": 			{ filename: "airstrip1.js" },
	"drencrom":				{ filename: "drencrom.js" },
	"sacrosanct":			{ filename: "sacrosanct.js" },
};