/// Manual create caretaker
/// Game.spawns['Home'].createCreep( [WORK, CARRY, MOVE, MOVE], null, {role: 'PIONEER'} );

var Finder = require('system.finder');
var Static = require('system.static');
var CreepFactory = require('factory.creep');
var WithdrawBehaviour = require('behaviour.withdraw');
var MoveBehaviour = require('behaviour.move');
var ConstructionCentral = require('central.construction');
var RepairCentral = require('central.repair');
var BaseHQ = require('base.hq');


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
            case 'BUILD':
                doBuild(creep);
                break;                   
            case 'IDLE':
                creep.move(Math.floor(Math.random() * 8) + 1);  
                break;
        }        
    },
    
    create: function(room) {
        var newCreep = CreepFactory.create(room, Static.ROLE_CARETAKER, 'WITHDRAW');
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            WithdrawBehaviour.setup(newCreep);
            newCreep.memory.constructionTargetId = null;
            newCreep.memory.repairTargetId = null;
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
    } else if (creep.carry.energy > 0 && RepairCentral.hasRepairNeed(creep.room)) {
        return 'REPAIR';
    } else if (creep.carry.energy > 0 && ConstructionCentral.hasConstructionOrders(creep.room)) {
        return 'BUILD';        
    } 
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    creep.memory.state = newState;
    switch(newState) {
        case 'WITHDRAW':
            WithdrawBehaviour.apply(creep, true, false);
            break;   
        case 'REPAIR':
            assignRepairWork(creep);
            break;   
        case 'BUILD':
            assignConstructionWork(creep);
            break;                          
    }
}

function assignRepairWork(creep) {
    var repairTarget = RepairCentral.nextInQueue(creep.room);
    if (repairTarget !== null) {
        creep.memory.repairTargetId = repairTarget.id;
        return;
    } 
    creep.memory.state = 'IDLE';
}

function assignConstructionWork(creep) {
    var constructionTarget = ConstructionCentral.getCurrentOrder(creep.room);
    if (constructionTarget !== null) {
        creep.memory.constructionTargetId = constructionTarget.id;
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

function doBuild(creep) {
    var target = Game.getObjectById(creep.memory.constructionTargetId);
    if (target !== null) {
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, target);
        }  
        return;
    }
    creep.memory.state = 'IDLE';
}

module.exports = RoleCaretaker;