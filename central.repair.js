var MEMORY = 'RepairCentral';
var Utils = require('system.utils');
var Society = require('central.society');

var WALL_HP_TARGET = 10000;

var RepairCentral = {

	init: function(room) {
        if (room.memory.SYS[MEMORY] === undefined || room.memory.SYS[MEMORY] === null) {
            room.memory.SYS[MEMORY] = {
            	repairQueue: [],
            	age: 0
            };
        }
    },

    run: function(room) {
        RepairCentral.init(room)
        var memory = getMemory(room);
        if (memory.age > 10) {
            memory.age = 0;
            scanRepairNeed(room);
        }
        memory.age++;   
    },

    hasRepairNeed(room) {
    	var memory = getMemory(room);
        if (memory !== undefined) {
    	   return (memory.repairQueue.length > 0);
        }
        return false;
    },

    nextInQueue(room) {
		var memory = getMemory(room);
		if (memory.repairQueue.length > 0) {
			var id = memory.repairQueue[0];
			return Game.getObjectById(id);
		}
		return null;
    },
    
    secondInQueue(room) {
		var memory = getMemory(room);
		if (memory.repairQueue.length > 1) {
			var id = memory.repairQueue[1];
			return Game.getObjectById(id);
		}
		return null;
    }    
};

function scanRepairNeed(room) {
	var memory = getMemory(room);
    var structures = room.find(FIND_STRUCTURES, {
        filter: function(obj) {
            return (
                (obj.my && obj.hits < (obj.hitsMax * 0.90) && obj.structureType != STRUCTURE_RAMPART) ||
                ((obj.structureType == STRUCTURE_WALL || obj.structureType == STRUCTURE_RAMPART) && obj.hits < (WALL_HP_TARGET * Society.getLevel(room))) ||
                (obj.structureType == STRUCTURE_ROAD && obj.hits < (obj.hitsMax * 0.50)) ||
                (obj.hits < (obj.hitsMax * 0.75) && obj.structureType != STRUCTURE_WALL && obj.structureType != STRUCTURE_RAMPART && obj.structureType != STRUCTURE_ROAD)
            );
        }
    });
    structures.sort( function(a,b) { return (a.hits / a.hitsMax) - (b.hits / b.hitsMax) } );  
    memory.repairQueue = Utils.createIdArray(structures);  
}

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}

module.exports = RepairCentral;