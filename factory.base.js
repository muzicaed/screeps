
var ConstructionCentral = require('central.construction');

var BaseFactory = {

	orderConstruction: function(room, blueprint, closeTo) {		
		var centerPos = BaseFactory.findBaseLocation(room, blueprint, closeTo);
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
	},

	findBaseLocation: function(room, blueprint, closeTo) {
	    var map = room.lookAtArea(0, 0, 49, 49);	    
		var potentinalLocations = [];
		for (var x = 1; x < (49 - blueprint.width); x++) {
			for (var y = 1; y < (49 - blueprint.height); y++) {		
				if (isPotentialLocation(map, blueprint, x, y)) {
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
};

function isPotentialLocation(map, blueprint, x, y) {    
    for(var i = x; i < x + blueprint.width; i++) {
        for(var j = y; j < y + blueprint.height; j++) {
            var tiles = map[j][i];
            for (var k = 0; k < tiles.length; k++) {
            	var tile = tiles[k];
	    		if (tile.type == 'structure' || (tile.type == 'terrain' && tile.terrain == 'wall') || tile.type == 'flag') {
	    			return false;
	    		}               	
            }         
        }
    }
    return true;
}

function createPotentinalLocation(room, blueprint, x, y, closeTo) {
	var centerPos = new RoomPosition(
		(x + Math.floor(blueprint.width * 0.5)),
		(y + Math.floor(blueprint.height * 0.5)),
		room.name
	);
	return { 
		pos: centerPos, 
		distance: centerPos.getRangeTo(closeTo)
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