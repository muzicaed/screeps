/// Manual create transporter
/// Game.spawns['Home'].createCreep( [CARRY, CARRY, MOVE, MOVE, MOVE], null, {role: 'TRANSPORTER'} );

var Finder = require('system.finder');
var Static = require('system.static');
var CreepFactory = require('factory.creep');
var ResourceCentral = require('central.resources');
var TransferBehaviour = require('behaviour.transfer');
var MoveBehaviour = require('behaviour.move');
var Utils = require('system.utils');

var RoleTransporter = {
    run: function(creep) {
        var action = think(creep);
        switch(action) {
            case 'COLLECT':
                doCollect(creep);
                break;
            case 'TRANSFER':
                TransferBehaviour.do(creep);
                break;
            case 'IDLE':
                creep.move(Math.floor(Math.random() * 6) + 8);
                break;                
        }        
    },
    
    create: function(room) {
        var newCreep = CreepFactory.create(room, Static.ROLE_TRANSPORTER, 'COLLECT');
        if (newCreep !== null) {
            newCreep.memory.transferCollectId = null;
            newCreep.memory.transferTargetId = null;
        }           
    }
};

function think(creep) {
    var newState = checkStateChange(creep);
    if (newState != creep.memory.state) {
        applyNewState(creep, newState);
    }
    return creep.memory.state;
}

function checkStateChange(creep) {
    if (creep.carry.energy == 0) {
        return 'COLLECT';
    } else if (creep.carry.energy == creep.carryCapacity) {
        return 'TRANSFER';
    } else if (creep.memory.state == 'IDLE') {
        if (creep.carry.energy > 0) {
            return 'TRANSFER';    
        }
        return 'COLLECT';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    //console.log(creep.name + ' new state: ' + newState);
    creep.memory.state = newState;
    switch(newState) {
        case 'COLLECT':
            applyCollect(creep);
            break;   
        case 'TRANSFER':
            TransferBehaviour.apply(creep)
            break;   
    }
}

function applyCollect(creep) {
    creep.memory.transferTargetId = null;  
    var containerId = findContainer(creep);
    if (containerId !== null) {
        creep.memory.transferCollectId = containerId;
        return;
    }
    creep.move(Math.floor(Math.random() * 6) + 8);    
    creep.memory.state = 'IDLE';
}

function findContainer(creep) {
    var bestContainerId = null;
    var maxEnergy = 0;
    var sources = ResourceCentral.getAllSources(creep.room);
    for (var i in sources) {
        var source = sources[i];
        if (source.containerId !== null) {
            var container = Game.getObjectById(source.containerId);
            if (container.store.energy > maxEnergy) {
                maxEnergy = container.store.energy;
                bestContainerId = source.containerId;
            }            
        }
    }
    
   return bestContainerId;
}

function doCollect(creep) {
    var container = Game.getObjectById(creep.memory.transferCollectId);
    if (container !== null) {
        if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            console.log('Move path');
            MoveBehaviour.movePath(creep, container);
        }    
    } else {
        creep.memory.state = 'IDLE'; 
    }
}

module.exports = RoleTransporter;