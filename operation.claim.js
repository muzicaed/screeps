var Static = require('system.static');
var Claimer = require('role.claimer');
var Colonizer = require('role.colonizer');
var Society = require('central.society');
var BaseHQ = require('base.hq');

var ClaimOperation = {

	run: function(operation) {
		updateOperation(operation);		
		handleCreepSpawn(operation);
		buildSpawn(operation);
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
			'colonizerCreeps': []
		};
	},

	isCompleted(operation) {
		var room = Game.rooms[operation.targetRoom];
		return (
			room !== undefined && 
			room.firstSpawn() !== null &&
			Society.getLevel(room) > Static.SOCIETY_LEVEL_OUTPOST
		);
	}
};

function updateOperation(operation) {
	operation.claimCreep = checkCreep(operation.claimCreep);
	var i = operation.colonizerCreeps.length;
	while (i--) {
	    var colonizer = operation.colonizerCreeps.pop();
	    if (checkCreep(colonizer) !== null) {
	    	operation.colonizerCreeps.push(colonizer);
	    }
	}

	var room = Game.rooms[operation.targetRoom];
	if (room !== undefined) {
		var sites = room.find(FIND_MY_CONSTRUCTION_SITES);
		operation.spawnConstructionSiteId = (sites.length > 0) ? sites[0].id : null;	
	}	
}

function checkCreep(creepName) {
	if (Game.creeps[creepName] === undefined) {
		return null;
	}
	return creepName;
}

function handleCreepSpawn(operation) {
	var ownerRoom = Game.rooms[operation.ownerRoom];
	var targetRoom = Game.rooms[operation.targetRoom];
	if (ownerRoom !== undefined && BaseHQ.currentBaseEnergy(ownerRoom) > 3000) {
		if (operation.colonizerCreeps.length < 2 && targetRoom !== undefined && targetRoom.controller.my) {
			var name = Colonizer.create(ownerRoom, operation.targetRoom)
			if (name !== null) {
				operation.colonizerCreeps.push(name);	
			}	
		} else if (operation.claimCreep === null && (targetRoom === undefined || !targetRoom.controller.my)) {
			operation.claimCreep = Claimer.create(ownerRoom, operation.targetRoom);
		}
	}
}

function buildSpawn(operation) {
	var targetRoom = Game.rooms[operation.targetRoom];
	if (operation.spawnConstructionSiteId == null && targetRoom !== undefined && targetRoom.controller.my && targetRoom.firstSpawn() == null) {
		var pos = BaseHQ.getOpimalBaseLocation(targetRoom);
		targetRoom.createConstructionSite(pos, STRUCTURE_SPAWN);	
	}	
}

module.exports = ClaimOperation;