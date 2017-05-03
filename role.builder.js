/// Manual create builder
/// Game.spawns['Home'].createCreep( [WORK, WORK, CARRY, MOVE], null, {role: 'BUILDER'} );

var Static = require('system.static');
var CreepFactory = require('factory.creep');
var WithdrawBehaviour = require('behaviour.withdraw');
var MoveBehaviour = require('behaviour.move');

//var WALL_HP_TARGET = 150000;
var WALL_HP_TARGET = 30000;

var RoleBuilder = {

    run: function(creep) {
        var action = think(creep);
        switch(action) {
            case 'WITHDRAW':
                WithdrawBehaviour.do(creep);
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
        var newCreep = CreepFactory.create(room, Static.ROLE_BUILDER, 'WITHDRAW');
        if (newCreep !== null) {
            newCreep.memory.buildTargetId = null;
            newCreep.memory.withdrawTargetId = null;
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
        return 'WITHDRAW';
    } else if (creep.carry.energy == creep.carryCapacity) {
        return 'BUILD';
    } else if (creep.memory.state == 'IDLE') {
       if (creep.carry.energy > 0) {
            return 'BUILD';    
        }
        return 'WITHDRAW';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    //console.log(creep.name + ' new state: ' + newState);
    creep.memory.state = newState;
    switch(newState) {
        case 'WITHDRAW':
            creep.memory.buildTargetId = null;
            WithdrawBehaviour.apply(creep, true);
            break;   
        case 'BUILD':
            creep.memory.withdrawTargetId = null;
            assignWork(creep);
            break;
    }
}

// TODO: Move this into central
function assignWork(creep) {
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length > 0) {
        creep.memory.buildTargetId = targets[0].id;
        return;
    }
    creep.memory.state = 'IDLE';
}

function doBuild(creep) {
    var target = Game.getObjectById(creep.memory.buildTargetId);
    if (target !== null) {
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, target);
        }  
        return;
    }
    creep.memory.state = 'IDLE';
}

module.exports = RoleBuilder;