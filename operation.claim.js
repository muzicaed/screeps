
var Claimer = require('role.claimer');

var ClaimOperation = {

	run: function(operation) {
		updateOperation(operation);
		handleSpawn(operation);
	},

	create: function (spec) {
		// Create operation object here.
		var targetRoom = Game.rooms[spec.targetRoom];
		console.log(spec.targetRoom);
		return {
			'ownerRoom': spec.ownerRoom,
			'targetRoom': spec.targetRoom,
			'controllerId': spec.controllerId,
			'spawnConstructionSiteId': null,
			'claimCreep': null,
			'buildCreep': null,
			'transportCreeps': []
		};
	},

	isCompleted(operation) {
		var room = Game.rooms[operation.targetRoom];
		return (room !== undefined && room.firstSpawn() !== null);
	}
};

function updateOperation(operation) {
	operation.claimCreep = checkCreep(operation.claimCreep);
	operation.buildCreep = checkCreep(operation.buildCreep);
	var i = operation.transportCreeps.length;
	while (i--) {
	    var transport = operation.transportCreeps.pop();
	    if (checkCreep(transport) !== null) {
	    	operation.transportCreeps.append(transport);
	    }
	}

	var room = Game.rooms[operation.targetRoom];
	if (room !== undefined) {
		var sites = room.find(FIND_MY_CONSTRUCTION_SITES);
		if (sites.length == 0) {
			operation.spawnConstructionSiteId = null;
		} else {
			operation.spawnConstructionSiteId = sites[0].id;
		}
	}	
}

function checkCreep(creepName) {
	if (Game.creeps[creepName] === undefined) {
		return null;
	}
	return creepName;
}

function handleSpawn(operation) {
	var ownerRoom = Game.rooms[operation.ownerRoom];
	if (ownerRoom !== undefined) {
		if (operation.claimCreep === null) {
			console.log('Try spawn Claimer');
			operation.claimCreep = Claimer.create(ownerRoom, operation.targetRoom);
		} else if (operation.buildCreep == null) {
			console.log('Try spawn builder');

		} else if (operation.transportCreeps.length < 2) {
			console.log('Try spawn transport');
		}
	}
}

module.exports = ClaimOperation;