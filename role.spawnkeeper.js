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
            case 'RELOAD_TOWER':
                doReloadTower(creep);                
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
            newCreep.memory.reloadId = null;
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
    } else if (findReloadWork(creep) !== null) {
        return 'RELOAD_TOWER';                
    } else if (creep.carry.energy > 0 && creep.room.energyAvailable != creep.room.energyCapacityAvailable) {
        return 'TRANSFER';
    }

    return creep.memory.state;
}

function applyNewState(creep, newState) {
    creep.memory.state = newState;
    switch(newState) {
        case 'WITHDRAW':
            WithdrawBehaviour.apply(creep, false);
            break;   
        case 'TRANSFER':
            TransferBehaviour.apply(creep);
            break;
        case 'RELOAD_TOWER':
            applyReloadTower(creep);
            break;            
    }
}

function applyReloadTower(creep) {
    var target = findReloadWork(creep);
    if (target !== null) { 
        creep.memory.reloadId = target.id;
        return;
    }
    creep.memory.state = 'IDLE';
}

function findReloadWork(creep) {
    var memory = Memory.towerManager[creep.room.name];
    for (i = 0; i < memory.towers.length; i++) {
        var tower = Game.getObjectById(memory.towers[i]);
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


module.exports = RoleSpawnKeeper;