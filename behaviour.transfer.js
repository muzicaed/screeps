var Finder = require('system.finder');
var ResourceCentral = require('central.resources');
var BaseHQ = require('base.hq');
var ControllerBase = require('base.controller');
var Utils = require('system.utils');
var MoveBehaviour = require('behaviour.move');
var Society = require('central.society');

var TransferBehaviour = {
    
    setup: function(creep) {
        creep.memory.transferTargetId = null;
        creep.memory.transferRoomName = creep.room.name;
    },

    // TODO: Refactor this function.
    apply: function(creep) { 
    var room = Game.rooms[creep.memory.transferRoomName];       
        if (room.controller.ticksToDowngrade > 2000) {
            var spawn = findDeliverySpawnStructure(creep);
            if (spawn !== null) {
                creep.memory.transferTargetId = spawn.id;
                return;
            }
        
            var container = findBestBaseContainer(creep);
            if (container !== null && _.sum(container.store) < container.storeCapacity) {
                creep.memory.transferTargetId = container.id;
                return;
            } 

            if (room.storage !== undefined && _.sum(room.storage.store) < 50000 && Society.getLevel(room) > 2) {
                creep.memory.transferTargetId = room.storage.id;
                return;
            }    
            
            if (room.storage !== undefined && _.sum(room.storage.store) < 10000) {
                creep.memory.transferTargetId = room.storage.id;
                return;
            }                
        }        

        var containerId = ControllerBase.getControllerContainerId(room);
        var controllerContainer = Game.getObjectById(containerId);
        if (controllerContainer !== null && _.sum(controllerContainer.store) < (controllerContainer.storeCapacity)) {
            creep.memory.transferTargetId = controllerContainer.id;
            return;
        }   

        if (room.storage !== undefined && _.sum(room.storage.store) < room.storage.storeCapacity) {
            creep.memory.transferTargetId = room.storage.id;
            return;
        }      
        creep.memory.state = 'IDLE';    
    },    
    
    do: function(creep) {
        var target = Game.getObjectById(creep.memory.transferTargetId);
        if (target !== null) {
            if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
               doTransferToContainer(creep, target);
               return;
            }
            doTransferToSpawn(creep, target);
            return;
        }
        creep.memory.state = 'IDLE';
    }    
};

function doTransferToSpawn(creep, target) {
    if (target.energy < target.energyCapacity) {
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, target);
        }
        return;
    } 
    creep.memory.state = 'IDLE';
}

function doTransferToContainer(creep, target) {
    if (target.store.energy < target.storeCapacity) {
        var res = creep.transfer(target, RESOURCE_ENERGY);
        if (res == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, target);
        } else if (res == ERR_FULL) {
            creep.memory.state = 'IDLE';        
        }    
        return;
    } else {
        MoveBehaviour.movePath(creep, target);
    }
    creep.memory.state = 'IDLE';
}

function findDeliverySpawnStructure(creep) {
    var room = Game.rooms[creep.memory.transferRoomName];
    var results = room.find(FIND_MY_STRUCTURES, {
        filter: function(obj) {
            return (
                (obj.structureType == STRUCTURE_SPAWN || obj.structureType == STRUCTURE_EXTENSION) &&
                (obj.energy < obj.energyCapacity)
            );
        }
    });
    
    return creep.pos.findClosestByRange(results);
}

function findBestBaseContainer(creep) {
    var room = Game.rooms[creep.memory.transferRoomName];
    var containers = Utils.createGameObjArr(BaseHQ.getAllBaseContainers(room));
    for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        if (_.sum(container.store) < container.storeCapacity) {
            return container;
        }
    }
    return null
}

module.exports = TransferBehaviour;