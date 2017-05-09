/// Manual create pioner
/// Game.spawns['Home'].createCreep( [WORK, CARRY, CARRY, MOVE, MOVE, MOVE], null, {role: 'PIONEER'} );

var Finder = require('system.finder');
var ResourceCentral = require('central.resources');
var RoadsCentral = require('central.roads');
var Static = require('system.static');
var CreepFactory = require('factory.creep');
var TransferBehaviour = require('behaviour.transfer');
var UpgradeControllerBehaviour = require('behaviour.controllerupgrade');
var MoveBehaviour = require('behaviour.move');

var RolePioneer = {

    run: function(creep) {
        checkAssignment(creep);
        var action = think(creep);
        switch(action) {
            case 'HARVEST':
                doHarvest(creep);
                break;
            case 'TRANSFER':
                TransferBehaviour.do(creep);
                break;  
           case 'UPGRADE_CONTROLLER':
                UpgradeControllerBehaviour.do(creep);
                break; 
            case 'IDLE':
                creep.move(Math.floor(Math.random() * 8) + 1);
                break;                
        }      
    },
    
    create: function(room) {
        var newCreep = CreepFactory.create(room, Static.ROLE_PIONEER, 'HARVEST');
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            TransferBehaviour.setup(newCreep);
            newCreep.memory.idleCount = 0;
            newCreep.memory.assignedToSourceId = ResourceCentral.requestPioneerAssignment(newCreep);
        }          
    },
    
    panicCreate: function(room) {
        var newCreep = CreepFactory.create(room, Static.ROLE_PIONEER, 'HARVEST', 300);
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            TransferBehaviour.setup(newCreep);
            newCreep.memory.idleCount = 0;
            newCreep.memory.assignedToSourceId = ResourceCentral.requestPioneerAssignment(newCreep);
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
    var controller = creep.room.controller;
    if ((controller.ticksToDowngrade < 800 || controller.level < 2) && creep.carry.energy == creep.carryCapacity) {
        creep.memory.idleCount = 0;
        return 'UPGRADE_CONTROLLER';
    } else if (creep.memory.state == 'IDLE') {
        creep.memory.idleCount += 1;
        if (creep.memory.idleCount > 1) {
            return 'UPGRADE_CONTROLLER'; 
        } else if (creep.carry.energy > 0) {
            return 'TRANSFER';    
        }
        return 'HARVEST';
    } else if (creep.carry.energy == 0) {
        creep.memory.idleCount = 0;
        return 'HARVEST';
    } else if (creep.carry.energy == creep.carryCapacity) {
        creep.memory.idleCount = 0;
        return 'TRANSFER';
    }
   
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    creep.memory.state = newState;
    switch(newState) {
        case 'UPGRADE_CONTROLLER':
            break;
        case 'HARVEST':
            creep.memory.transferTargetId = null;
            break;   
        case 'TRANSFER':
            TransferBehaviour.apply(creep);
            break;   
    }
}

function doHarvest(creep) {
    var source = Game.getObjectById(creep.memory.assignedToSourceId);
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        MoveBehaviour.movePath(creep, source);
    }    
}

function checkAssignment(creep) {
    if (creep.memory.assignedToSourceId === null || creep.memory.assignedToSourceId === undefined)  {
        creep.memory.assignedToSourceId = ResourceCentral.requestPioneerAssignment(creep);
    }
}

module.exports = RolePioneer;