
var Utils = require('system.utils');

// TODO: Cache that lasts during script execution.

var SystemFinder = {    
    
    countRole: function(room, roleName) { 
        return room.find(FIND_MY_CREEPS, {
            filter: function(obj) {
                return (obj.memory.role == roleName);
            }
        }).length;    
    },
    
    findWithdrawSpawnStructure: function(room) {
        var results = room.find(FIND_MY_STRUCTURES, {
            filter: function(obj) {
                return (
                    (obj.structureType == STRUCTURE_SPAWN || obj.structureType == STRUCTURE_EXTENSION) &&
                    (obj.energy > 0)
                );
            }
        });
        
        results.sort( function(a, b) { return b.energy - a.energy } );  
        return (results.length > 0 ? results[0] : null);
    },  
    
    findAllStructures: function(room, structureType, isMy) {
        return room.find(FIND_MY_STRUCTURES, {
            filter: function(obj) {
                return (
                    (isMy && obj.structureType == structureType && obj.my) ||
                    (!isMy && obj.structureType == structureType)
                );
            }
        });
    },

    findContainersInRange: function(pos, range) {
        return pos.findInRange(FIND_STRUCTURES, range, {
            filter: function(obj) { return (obj.structureType == STRUCTURE_CONTAINER) }
        });
    },

    findContainerId: function(pos, dist) {
       var sourceContainers = Utils.createIdArray(SystemFinder.findContainersInRange(pos, dist)); 
        if (sourceContainers.length > 0) {
            return sourceContainers[0];
        }
        return null;
    }
};

module.exports = SystemFinder;