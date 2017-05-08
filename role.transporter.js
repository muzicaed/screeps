/// Manual create transporter
/// Game.spawns['Home'].createCreep( [CARRY, CARRY, MOVE, MOVE, MOVE], null, {role: 'TRANSPORTER'} );

var Finder = require('system.finder');
var Static = require('system.static');
var CreepFactory = require('factory.creep');
var ResourceCentral = require('central.resources');
var TransferBehaviour = require('behaviour.transfer');
var MoveBehaviour = require('behaviour.move');
var BaseHQ = require('base.hq');
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
    
    create: function(room, transporterRole, collectContainerId) {
        var newCreep = CreepFactory.create(room, transporterRole, 'COLLECT');
        if (newCreep !== null) {
            newCreep.memory.collectContainerId = null;
            if (collectContainerId !== undefined || collectContainerId !== null) {
                newCreep.memory.collectContainerId = collectContainerId;                           
            }            
            MoveBehaviour.setup(newCreep);
            TransferBehaviour.setup(newCreep);
            newCreep.memory.transferCollectId = null;
            return newCreep.name;
        }  
        return null;         
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
            TransferBehaviour.apply(creep);
            break;   
    }
}

function applyCollect(creep) {
    creep.memory.transferTargetId = null; 

    if (creep.memory.collectContainerId !== undefined && creep.memory.collectContainerId !== null) {
        creep.memory.transferCollectId = creep.memory.collectContainerId;
        return;
    }

    var containerId = findContainer(creep);
    if (containerId !== null) {
        creep.memory.transferCollectId = containerId;
        return;
    }
    creep.move(Math.floor(Math.random() * 6) + 8);    
    creep.memory.state = 'IDLE';
}

function findContainer(creep) {
    console.log('Transporter .findContainer()');
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
            MoveBehaviour.movePath(creep, container);
        }    
    } else {
        creep.memory.state = 'IDLE'; 
    }
}

module.exports = RoleTransporter;