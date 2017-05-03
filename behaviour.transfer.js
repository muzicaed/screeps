var Finder = require('system.finder');
var ResourceCentral = require('central.resources');
var BaseHQ = require('base.hq');
var ControllerBase = require('base.controller');
var Utils = require('system.utils');
var MoveBehaviour = require('behaviour.move');

var TransferBehaviour = {
    
    apply: function(creep) {
        creep.memory.transferCollectId = null;  
        
        if (creep.room.controller.ticksToDowngrade > -1) {
            var spawn = findDeliverySpawnStructure(creep);
            if (spawn !== null) {
                creep.memory.transferTargetId = spawn.id;
                return;
            }
        
            var container = findBestBaseContainer(creep);
            if (container !== null) {
                creep.memory.transferTargetId = container.id;
                return;
            } 
        }
        
        var containerId = ControllerBase.getControllerContainerId(creep.room);
        if (containerId !== null) {
            creep.memory.transferTargetId = containerId;
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
    var results = creep.room.find(FIND_MY_STRUCTURES, {
        filter: function(obj) {
            return (
                (obj.structureType == STRUCTURE_SPAWN || obj.structureType == STRUCTURE_EXTENSION) &&
                (obj.energy < obj.energyCapacity) &&
                (obj.isActive())
            );
        }
    });
    
    return creep.pos.findClosestByRange(results);
}

function findBestBaseContainer(creep) {
    var containers = Utils.createGameObjArr(BaseHQ.getAllBaseContainers(creep.room));
    for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        if (container.isActive()) {
            if (container.structureType == STRUCTURE_STORAGE && container.store.energy < 3000) {
                return containers[i];
            } else if (container.structureType == STRUCTURE_CONTAINER && _.sum(container.store) < container.storeCapacity) {
                return container;
            }
        }
    }
    return null
}

module.exports = TransferBehaviour;