/// Manual create transporter
/// Game.spawns['Home'].createCreep( [CARRY, CARRY, MOVE, MOVE, MOVE], null, {role: 'TRANSPORTER'} );

var Static = require('system.static');
var CreepFactory = require('factory.creep');
var MoveBehaviour = require('behaviour.move');

var RoleDefender = {    
    run: function(creep) {         
        var action = think(creep);
        switch(action) {
            case 'ATTACK':
                doAttack(creep);
                break;
            case 'FLAG_MOVE':
                doFlagMove(creep);
                break;                 
            case 'IDLE':
                creep.memory.enemyTargetId = null;
                creep.move(Math.floor(Math.random() * 6) + 8);
                break;                
        }        
    },
    
    create: function(room) {
        var newCreep = CreepFactory.create(
            room, 
            Static.ROLE_DEFENDER, 
            'IDLE',
            room.energyCapacityAvailable * 0.75);
        if (newCreep !== null) {
            newCreep.memory.enemyTargetId = null;
            MoveBehaviour.setup(newCreep);
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
    var enemies = creep.room.find(FIND_HOSTILE_CREEPS);
    var flag = Game.flags['INVATION'];
    if (enemies.length > 0) {
        return 'ATTACK';
    } else if (flag !== undefined) {
        return 'FLAG_MOVE';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {    
    creep.memory.state = newState;
    switch(newState) {
        case 'ATTACK':
            applyAttack(creep);
            break;
    }
}

function applyAttack(creep) {
    var enemies = creep.room.find(FIND_HOSTILE_CREEPS);
    var weakestEnemy = null;
    var bestRatio = 2.00;

    for(var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        if ((enemy.hits / enemy.hitsMax) < bestRatio) {
            bestRatio = (enemy.hits / enemy.hitsMax);
            weakestEnemy = enemy;
        }
    }

    if (enemy !== null) {
        creep.memory.enemyTargetId = enemy.id;
        return;
    }

    var enemyStructure = creep.room.findClosestByPath(FIND_HOSTILE_STRUCTURES);
    if (enemyStructure !== null) {
        creep.memory.enemyTargetId = enemyStructure.id;
    }
  
    creep.memory.state = 'FLAG_MOVE';
}

function doAttack(creep) {
    var target = Game.getObjectById(creep.memory.enemyTargetId);
    if (target !== null) {
        if (creep.attack(target) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, target);
        }    
    } else {
        creep.memory.state = 'FLAG_MOVE'; 
    }
}

function doFlagMove(creep) {
    var flag = Game.flags['INVATION'];
    if (flag !== undefined) {
        MoveBehaviour.movePath(creep, flag);
    }
}


module.exports = RoleDefender;