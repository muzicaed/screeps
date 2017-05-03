/// Manual create caretaker
/// Game.spawns['Home'].createCreep( [WORK, CARRY, MOVE, MOVE], null, {role: 'PIONEER'} );

var Finder = require('system.finder');
var Static = require('system.static');
var CreepFactory = require('factory.creep');
var WithdrawBehaviour = require('behaviour.withdraw');
var MoveBehaviour = require('behaviour.move');
var Society = require('central.society');

var WALL_HP_TARGET = 10000;

var RoleCaretaker = {

    run: function(creep) {
        var action = think(creep);
        switch(action) {
            case 'WITHDRAW':
                WithdrawBehaviour.do(creep);
                break;
            case 'REPAIR':
                doRepair(creep);
                break;
            case 'RELOAD_TOWER':
                doReloadTower(creep);
                break;    
            case 'IDLE':
                creep.move(Math.floor(Math.random() * 8) + 1);  
                break;
        }        
    },
    
    create: function(room) {
        var newCreep = CreepFactory.create(room, Static.ROLE_CARETAKER, 'WITHDRAW');
        if (newCreep !== null) {
            newCreep.memory.repairTargetId = null;
            newCreep.memory.withdrawTargetId = null;
            newCreep.memory.reloadId = null;
            return true;
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
    if (creep.carry.energy == 0) {
        return 'WITHDRAW';    
    } else if (findReloadWork(creep) !== null) {
        // NOT OPTIMAL!!
        return 'RELOAD_TOWER';
    } else if (creep.carry.energy == creep.carryCapacity) {
        return 'REPAIR';
    } else if (creep.memory.state == 'IDLE') {
        return 'WITHDRAW';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    //console.log(creep.name + ' new state: ' + newState);
    creep.memory.state = newState;
    switch(newState) {
        case 'RELOAD_TOWER':
            creep.memory.repairTargetId = null;
            creep.memory.withdrawTargetId = null;
            applyReloadTower(creep);
            break;
        case 'WITHDRAW':
            creep.memory.repairTargetId = null;
            creep.memory.reloadId = null;
            WithdrawBehaviour.apply(creep, true);
            break;   
        case 'REPAIR':
            creep.memory.withdrawTargetId = null;
            creep.memory.reloadId = null;
            assignWork(creep);
            break;   
    }
}

// TODO: Move this into central
function assignWork(creep) {
    var repairTarget = findRepairTarget(creep);
    if (repairTarget !== null) {
        creep.memory.repairTargetId = repairTarget.id;
        return;
    }
    creep.memory.state = 'IDLE';
}

function applyReloadTower(creep) {
    var target = findReloadWork(creep);
    if (target !== null) {
        creep.memory.reloadId = target.id;
        return;
    }
    creep.memory.state = 'IDLE';
}

function doRepair(creep) {
   var target = Game.getObjectById(creep.memory.repairTargetId);
    if (target !== null && target.hits < target.hitsMax) {
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, target);
        }  
        return;
    }
    creep.memory.state = 'IDLE';
}

function findReloadWork(creep) {
    var towers = Finder.findAllStructures(creep.room, STRUCTURE_TOWER, true);
    for (var i = 0; i < towers.length; i++) {
        var tower = towers[i];
        if (tower.energy < tower.energyCapacity) {
            return tower;
        }
    }
    return null;
}

function doReloadTower(creep) {
   var tower = Game.getObjectById(creep.memory.reloadId);
    if (tower !== null && tower.energy < tower.energyCapacity) {
        if (creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, tower);
        }  
        return;
    }
    creep.memory.state = 'IDLE';    
}

// TODO: REFACTORING - Move to central!
function findRepairTarget(creep) {
    var oldTarget = Game.getObjectById(creep.memory.repairTargetId);
    if (oldTarget !== null && oldTarget.hits < oldTarget.hitsMax && oldTarget.structureType != STRUCTURE_WALL) {
        return oldTarget;
    }
    
    var targets = creep.room.find(FIND_STRUCTURES, {
        filter: function(obj) {
            return (
                (obj.my && obj.hits < obj.hitsMax && obj.structureType != STRUCTURE_RAMPART) ||
                ((obj.structureType == STRUCTURE_WALL || obj.structureType == STRUCTURE_RAMPART) && obj.hits < (WALL_HP_TARGET * Society.getLevel(creep.room))) ||
                (obj.structureType == STRUCTURE_ROAD && obj.hits < (obj.hitsMax * 0.45)) ||
                (obj.hits < obj.hitsMax * 0.75 && obj.structureType != STRUCTURE_WALL && obj.structureType != STRUCTURE_RAMPART && obj.structureType != STRUCTURE_ROAD)
            );
        }
    });
    targets.sort((a,b) => a.hits - b.hits);
    targets.sort( function(a,b) { return a.hits - b.hits } );
    if (typeof targets[0] !== "undefined") {
        return targets[0];
    }
    return null;
}

module.exports = RoleCaretaker;