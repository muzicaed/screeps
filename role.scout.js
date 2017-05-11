/// Manual create transporter
/// Game.spawns['Home'].createCreep( [CARRY, CARRY, MOVE, MOVE, MOVE], null, {role: 'TRANSPORTER'} );

var Static = require('system.static');
var CreepFactory = require('factory.creep');
var MoveBehaviour = require('behaviour.move');
var Utils = require('system.utils');
var OperationManager = require('operation.manager');

var RoleScout = {
    run: function(creep) {
        var action = think(creep);
        switch(action) {
            case 'FIND_SCOUT_TARGET':
                if (creep.memory.roomCount < 10) { 
                    MoveBehaviour.movePath(creep, new RoomPosition(25, 25, creep.memory.targetRoomName));                 
                    creep.memory.roomCount++;
                    return;
                }              
                doFindScoutTarget(creep);                  
                break;            
            case 'SCOUT':
                doScout(creep);
                creep.memory.roomCount = 0;
                break;              
            case 'REPORT':
                if (creep.memory.roomCount < 10) { 
                    MoveBehaviour.movePath(creep, new RoomPosition(25, 25, creep.memory.targetRoomName));                 
                    creep.memory.roomCount++;
                }    
                doReport(creep);
                break;                 
        }  
    },
    
    create: function(room) {
        var newCreep = CreepFactory.create(room, Static.ROLE_SCOUT, 'FIND_SCOUT_TARGET');
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            newCreep.memory.lastRoomName = null;
            newCreep.memory.targetRoomName = null;
            newCreep.memory.roomCount = 0;
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
    if (creep.room.name != creep.memory.lastRoomName) {
        return 'REPORT';
    } else if (creep.memory.state == 'REPORT') {
        return 'FIND_SCOUT_TARGET';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    creep.memory.state = newState;
    switch(newState) {
        case 'SCOUT':
            break;   
        case 'REPORT':
            break; 
        case 'FIND_SCOUT_TARGET':
            break;                
    }
}

function doFindScoutTarget(creep) {
    var neutralRooms = [];
    var myRooms = [];

    var exits = Game.map.describeExits(creep.room.name);
    for (var i in exits) {
        var roomName = exits[i];
        if (roomName != creep.memory.lastRoomName) {
            switch (OperationManager.getRoomExploreState(roomName)) {
                case Static.EXPLORE_UNKNOWN:
                    creep.memory.targetRoomName = roomName;                                        
                    return;
                    break;
                case Static.EXPLORE_MY_CONTROL:
                    myRooms.push(roomName);
                    break;
                case Static.EXPLORE_NEUTRAL:
                    neutralRooms.push(roomName);
                    break;
                case Static.EXPLORE_ENEMY: 
                    neutralRooms.push(roomName);
                    break;
            }
        }
    }

    pickBestTargetRoom(creep, neutralRooms, myRooms);    
    creep.memory.state = 'SCOUT';
}

function doScout(creep) {    
    console.log('Scout .doScout()');
    var roomPos = new RoomPosition(25, 25, creep.memory.targetRoomName);    
    if (roomPos !== undefined && roomPos !== null) {
        MoveBehaviour.movePath(creep, roomPos);          
        return;      
    }
    creep.memory.state = 'FIND_SCOUT_TARGET';
}

function doReport(creep) {
    var room = creep.room;
    if (OperationManager.needReport(room)) {   
        OperationManager.processScoutReport(room);
    }
    if (creep.memory.targetRoomName !== null) {
        var roomPos = new RoomPosition(25, 25, creep.memory.targetRoomName);        
        MoveBehaviour.movePath(creep, roomPos);    
    }  
    creep.memory.lastRoomName = room.name;
}

function pickBestTargetRoom(creep, neutralRooms, myRooms) {
    if (neutralRooms.length > 0) {
        neutralRooms.sort( function(a, b) { return a.timeStamp - b.timeStamp } );
        creep.memory.targetRoomName = neutralRooms[0];
        return;
    } else if (myRooms.length > 0) {
        myRooms.sort( function(a, b) { return a.timeStamp - b.timeStamp } );
        creep.memory.targetRoomName = myRooms[0];        
        return;
    }
    creep.memory.targetRoomName = creep.memory.lastRoomName;
}

module.exports = RoleScout;