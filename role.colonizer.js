var Static = require('system.static');
var CreepFactory = require('factory.creep');
var MoveBehaviour = require('behaviour.move');
var WithdrawBehaviour = require('behaviour.withdraw');

var RoleColonizer = {
    run: function(creep) {
        var action = think(creep);
        switch(action) {
            case 'MOVE_TO_TARGET':
                MoveBehaviour.movePath(creep, new RoomPosition(25, 25, creep.memory.targetRoomName));  
                break;                       
            case 'BUILD':
                doBuild(creep);
                break;                 
            case 'WITHDRAW':
                WithdrawBehaviour.do(creep);
                break;                 
        }  
    },
    
    create: function(room, targetRoomName) {
        var newCreep = CreepFactory.create(room, Static.ROLE_COLONIZER, 'WITHDRAW');
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            WithdrawBehaviour.setup(newCreep);
            newCreep.memory.homeRoomName = room.name;
            newCreep.memory.targetRoomName = targetRoomName;
            newCreep.memory.constructionTargetId = null;
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
        return 'WITHDRAW';
    } else if (creep.carry.energy == creep.carryCapacity && creep.room.name != creep.memory.targetRoomName) {
        return 'MOVE_TO_TARGET'; 
    } else if (creep.room.name == creep.memory.targetRoomName) {
        return 'BUILD';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    creep.memory.state = newState;
    switch(newState) {
        case 'MOVE_TO_TARGET':
            break;   
        case 'BUILD':
            assignConstructionWork(creep);
            break;                          
        case 'WITHDRAW':
            WithdrawBehaviour.apply(creep, true);
            break;                 
    }
}

function assignConstructionWork(creep) {
    var sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    if (sites.length > 0) {
        var site = sites[0];
        creep.memory.constructionTargetId = site.id;
        return;
    }
    creep.memory.constructionTargetId = null;
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

module.exports = RoleColonizer;