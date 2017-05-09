/// Manual create harvester
/// Game.spawns['Home'].createCreep( [WORK, CARRY, CARRY, MOVE, MOVE, MOVE], null, {role: 'HARVESTER'} );

var ResourceCentral = require('central.resources');
var Static = require('system.static');
var CreepFactory = require('factory.creep');
var MoveBehaviour = require('behaviour.move');


var RoleHarvester = {
    
    run: function(creep) {
        checkAssignment(creep);
        checkReplacement(creep);
        var action = think(creep);
        switch(action) {
            case 'HARVEST':
                doHarvest(creep);
                break;
            case 'DROP':
                creep.drop(RESOURCE_ENERGY);
                break;  
        }
    },
    
    create: function(room, assignment) {
        var newCreep = CreepFactory.create(room, Static.ROLE_HARVESTER, 'HARVEST');
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            if (assignment == {}) {
                requestAssignment(newCreep);                
            } else {
                newCreep.memory.assignedToSourceId = assignment.sourceId;
                newCreep.memory.assignedToContainerId = assignment.containerId;           
            }
            
            newCreep.memory.initialTicksToLive = newCreep.ticksToLive;
            newCreep.memory.distanceInTicks = null;            
            newCreep.memory.bornInRoom = room.name;
            newCreep.memory.replacementAck = false;
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
        return 'HARVEST';
    } else if (creep.carry.energy == creep.carryCapacity) {
        return 'DROP';
    } else if (creep.memory.state == 'IDLE') {
        if (creep.carry.energy > 0) {
            return 'DROP';    
        }
        return 'HARVEST';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    creep.memory.state = newState;
    switch(newState) {
        case 'HARVEST':
            break;   
        case 'DROP':
            break;   
    }
}

function doHarvest(creep) {
    var source = Game.getObjectById(creep.memory.assignedToSourceId);
    var container = Game.getObjectById(creep.memory.assignedToContainerId);
    if (container !== null && source !== null) {
        if (creep.pos.x == container.pos.x && creep.pos.y == container.pos.y) {            
            creep.harvest(source);
            return;
        }  else if (creep.pos.getRangeTo(container) <= 1) {
            atDestination(creep);
        }
        MoveBehaviour.movePath(creep, container.pos);
    }
}

function requestAssignment(creep) {
    var assignObj = ResourceCentral.requestHarvestAssignment(creep);
    if (assignObj !== null) {
        creep.memory.assignedToSourceId = assignObj.sourceId;
        creep.memory.assignedToContainerId = assignObj.containerId;        
    }    
}

function checkAssignment(creep) {
    if (creep.memory.assignedToSourceId === undefined || creep.memory.assignedToSourceId === null ||
        creep.memory.assignedToContainerId === undefined || creep.memory.assignedToContainerId === null
    )  {
        requestAssignment(creep);
    }
}

function atDestination(creep) {
    if (creep.memory.distanceInTicks === null) {
        creep.memory.distanceInTicks = creep.memory.initialTicksToLive - creep.ticksToLive;
    }
}

function checkReplacement(creep) {
    if (creep.ticksToLive <= (creep.memory.distanceInTicks + 20) && !creep.memory.replacementAck) {
        console.log(creep.name + ' requested replacement.');
        var room = Game.rooms[creep.memory.bornInRoom];
        var name = RoleHarvester.create(room, {
            sourceId: creep.memory.assignedToSourceId,
            containerId: creep.memory.assignedToContainerId 
        });
        creep.memory.replacementAck = (name !== null);
    }
}

module.exports = RoleHarvester;