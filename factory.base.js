
var ConstructionCentral = require('central.construction');

var BaseFactory = {

	orderConstruction: function(room, blueprint, closeTo) {		
		var centerPos = findBaseLocation(room, blueprint, closeTo);
		if (centerPos !== null) {
			BaseFactory.placeConstructionOrders(room, blueprint, centerPos);
			return centerPos;
		}
		return null;
	},

	placeConstructionOrders: function(room, blueprint, centerPos) {
		var count = 0;
		var xOff = Math.floor(blueprint.width * 0.5);
		var yOff = Math.floor(blueprint.height * 0.5);
		for (var x = (centerPos.x - xOff); x <= (centerPos.x + xOff); x++) {
			for (var y = (centerPos.y - yOff); y <= (centerPos.y + yOff); y++) {
				var type = blueprint.map[count];
				if (type != '0') {
					ConstructionCentral.order(room, parts[type], room.getPositionAt(x, y));
				}
				count++;
			}
		}	
	}

};

function findBaseLocation(room, blueprint, closeTo) {
	var potentinalLocations = []
	for (var x = 0; x < (50 - blueprint.width); x++) {
		for (var y = 0; y < (50 - blueprint.height); y++) {
			if (isPotentialLocation(room, blueprint, x, y)) {
				var location = createPotentinalLocation(room, blueprint, x, y, closeTo);
				potentinalLocations.push(location);
			}
		}
	}	

	if (potentinalLocations.length > 0) {
		potentinalLocations.sort( function(a, b) { return a.distance - b.distance } );		
		return potentinalLocations[0].pos;
	}
	return null;
}

function isPotentialLocation(room, blueprint, x, y) {
	var results = room.lookAtArea(y, x, y + (blueprint.height - 1), x + (blueprint.width - 1), true);
	for (var i = 0; i < results.length; i++) {
		var tile = results[i];

		if (tile.type == 'structure' || (tile.type == 'terrain' && tile.terrain == 'wall') || tile.type == 'flag') {
			return false;
		}
	}
 	return true;
}

function createPotentinalLocation(room, blueprint, x, y, closeTo) {
	var centerPos = room.getPositionAt(
		(x + Math.floor(blueprint.width * 0.5)), 
		(y + Math.floor(blueprint.height * 0.5))
	);
	return { 
		pos: centerPos, 
		distance: centerPos.findPathTo(closeTo, { ignoreCreeps: true, ignoreRoads: true }).length
	};
}

var parts = {
    'S': STRUCTURE_SPAWN,
    'E': STRUCTURE_EXTENSION,
    'R': STRUCTURE_ROAD,
    'C': STRUCTURE_CONTAINER,
    'T': STRUCTURE_TOWER,
    '1': STRUCTURE_STORAGE,
    'W': STRUCTURE_WALL,
    '2': STRUCTURE_RAMPART,
    'N': STRUCTURE_NUKER,
    '3': STRUCTURE_TERMINAL,
    'L': STRUCTURE_LAB,
    'X': STRUCTURE_EXTRACTOR,
    'P': STRUCTURE_POWER_SPAWN,
    'B': STRUCTURE_POWER_BANK,
    'O': STRUCTURE_OBSERVER,
    '4': STRUCTURE_LINK,
    '5': STRUCTURE_PORTAL
};

module.exports = BaseFactory;