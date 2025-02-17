var Finder = require('system.finder');
var ResourceCentral = require('central.resources');
var BaseHQ = require('base.hq');
var Society = require('central.society');
var Utils = require('system.utils');
var MoveBehaviour = require('behaviour.move');

var WithdrawBehaviour = {
    
    setup: function(creep) {
        creep.memory.withdrawTargetId = null;
        creep.memory.withdrawRoomName = creep.room.name;        
    },

    apply: function(creep, isSpawnWithdraw, isFullWithdraw) {
        var room = Game.rooms[creep.memory.withdrawRoomName];
        if (isFullWithdraw || BaseHQ.currentBaseEnergy(room) > 1500) {
            if (room.storage !== undefined && room.storage.store.energy > 0) {
                creep.memory.withdrawTargetId = room.storage.id;
                return;
            }
    
            var container = findBestBaseContainer(room);
            if (container !== null) {
                creep.memory.withdrawTargetId = container.id;
                return;
            } 
        }  

        if (isSettlementWithdrawAllowed(room) && isSpawnWithdraw) {
            var spawn = Finder.findWithdrawSpawnStructure(room);
            if (spawn !== null) {
                creep.memory.withdrawTargetId = spawn.id;
                return;
            }
        }
        
        creep.memory.state = 'IDLE';  
    },     
    
    do: function(creep) {
        var source = Game.getObjectById(creep.memory.withdrawTargetId);
        if (source !== null) {        
            if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                MoveBehaviour.movePath(creep, source);
            }   
            return;
        }
        creep.memory.state = 'IDLE';
    }
};

function isSettlementWithdrawAllowed(room) {
    return (
        Society.isSettlement(room) &&
        ResourceCentral.countAvailablePioneerAssignments(room) <= 0 &&
        room.energyAvailable > (room.energyCapacityAvailable * 0.7)
    );
}

function findBestBaseContainer(room) {
    var best = null;
    var bestEnergy = 0;
    var containers = Utils.createGameObjArr(BaseHQ.getAllBaseContainers(room));
    for (var i = 0; i < containers.length; i++) {
        if (containers[i] !== null && containers[i].store.energy > bestEnergy) {
            bestEnergy = containers[i].store.energy;
            best = containers[i];
        }
    }
    return best;
}


module.exports = WithdrawBehaviour;