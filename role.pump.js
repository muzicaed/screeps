
var Finder = require('system.finder');
var Static = require('system.static');
var ResourceCentral = require('central.resources');
var CreepFactory = require('factory.creep');
var UpgradeControllerBehaviour = require('behaviour.controllerupgrade');
var ControllerBase = require('base.controller');
var MoveBehaviour = require('behaviour.move');

var RolePump = {

    run: function(creep) {
        var action = think(creep);
        switch(action) {
            case 'POSITION':                
                doPosition(creep);
                break;            
            case 'SUCK':
                doSuck(creep);
                break;
            case 'UPGRADE_CONTROLLER':
                UpgradeControllerBehaviour.do(creep);
                break;  
        }        
    },
    
    create: function(room) {
        var controllerContainerId = ControllerBase.getControllerContainerId(room);
        if (controllerContainerId !== null) {
            var newCreep = CreepFactory.create(room, Static.ROLE_PUMP, 'SUCK');
            if (newCreep !== null) {
                MoveBehaviour.setup(newCreep);
                newCreep.memory.controllerContainerId = controllerContainerId;
                newCreep.memory.controllerId = room.controller.id;
                newCreep.memory.inPosition = false;
                newCreep.memory.targetPos = { x: null, y: null};
                return true;
            }   
        }
        return false;
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
    if (!creep.memory.inPosition) {
        return 'POSITION';
    } else if (creep.carry.energy == 0) {
        return 'SUCK';    
    }
    return 'UPGRADE_CONTROLLER';
}

function applyNewState(creep, newState) {
    creep.memory.state = newState;
    switch(newState) {
        case 'POSITION':
            break;        
        case 'SUCK':
            break;
        case 'UPGRADE_CONTROLLER':
            break;            
    }
}

function findTargetPos(creep) {
    var target = Game.getObjectById(creep.memory.controllerContainerId);
    if (target !== null) {
        for (var yMod = -1; yMod <= 0; yMod++) {
            for (var xMod = -1; xMod <= 1; xMod++) {
                var creeps = creep.room.lookForAt(LOOK_CREEPS, (target.pos.x + xMod), (target.pos.y + yMod));
                if (creeps.length == 0 || creeps[0].id == creep.id) {
                    return { x: (target.pos.x + xMod), y: (target.pos.y + yMod) };        
                }
            }
        }
    }

    creep.memory.controllerContainerId = ControllerBase.getControllerContainerId(creep.room);
    return { x: creep.pos.x + xMod, y: creep.pos.y};
}

function doSuck(creep) {
   var target = Game.getObjectById(creep.memory.controllerContainerId);
    if (target !== null) {
        if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(target, source);
        }           
        return;
    }
    creep.memory.state = 'IDLE';
}

function doPosition(creep) {
    creep.memory.targetPos = findTargetPos(creep);
    var targetPos = creep.memory.targetPos;
    if (targetPos !== null) {       
        if (creep.pos.x == targetPos.x && creep.pos.y == targetPos.y) {
            creep.memory.inPosition = true;
            return;
        }
        MoveBehaviour.movePath(creep, creep.room.getPositionAt(targetPos.x, targetPos.y));
        return;
    }
    creep.memory.state = 'IDLE';
}

module.exports = RolePump;