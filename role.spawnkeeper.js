var Static = require('system.static');
var CreepFactory = require('factory.creep');
var WithdrawBehaviour = require('behaviour.withdraw');
var TransferBehaviour = require('behaviour.transfer');
var MoveBehaviour = require('behaviour.move');

var RoleSpawnKeeper = {

    run: function(creep) {
        var action = think(creep);
        switch(action) {
            case 'WITHDRAW':
                WithdrawBehaviour.do(creep);
                break;
            case 'TRANSFER':
                TransferBehaviour.do(creep);
                break;
            case 'IDLE':
                creep.move(Math.floor(Math.random() * 8) + 1);
                break;
        }
    },
    
    create: function(room) {
        var newCreep = CreepFactory.create(room, Static.ROLE_SPAWNKEEPER, 'WITHDRAW');
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            TransferBehaviour.setup(newCreep);
            WithdrawBehaviour.setup(newCreep);
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
    if (creep.carry.energy > 0) {
        return 'TRANSFER';
    } else if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
        return 'WITHDRAW';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    //console.log(creep.name + ' new state: ' + newState);
    creep.memory.state = newState;
    switch(newState) {
        case 'WITHDRAW':
            WithdrawBehaviour.apply(creep, false);
            break;   
        case 'TRANSFER':
            TransferBehaviour.apply(creep);
            break;
    }
}


module.exports = RoleSpawnKeeper;