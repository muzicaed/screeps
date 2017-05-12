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
                if (creep.memory.roomCount < 10 && creep.memory.targetRoomName !== null && creep.memory.targetRoomName !== undefined) { 
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
                doReport(creep);
                creep.memory.roomCount = 0;
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
    var otherRooms = [];
    var myRooms = [];

    var exits = Game.map.describeExits(creep.room.name);
    for (var i in exits) {
        var roomName = exits[i];
        if (roomName != creep.memory.lastRoomName) {
            switch (OperationManager.getRoomExploreState(roomName)) {
                case Static.EXPLORE_UNKNOWN:
                    creep.memory.targetRoomName = roomName;  
                    creep.memory.state = 'SCOUT';
                    return;
                    break;
                case Static.EXPLORE_MY_CONTROL:
                case Static.EXPLORE_MY_OPERATION:
                    myRooms.push({
                        name: roomName,
                        timeStamp: OperationManager.getRoomExploreTimeStamp(roomName)
                    });
                    break;
                case Static.EXPLORE_ENEMY: 
                case Static.EXPLORE_ENEMY_OPERATION:                    
                case Static.EXPLORE_NEUTRAL:
                    otherRooms.push({
                        name: roomName,
                        timeStamp: OperationManager.getRoomExploreTimeStamp(roomName)
                    });                    
                    break;
            }
        }
    }
    pickBestTargetRoom(creep, otherRooms, myRooms);    
    creep.memory.state = 'SCOUT';
}

function doScout(creep) {   
    if (creep.memory.targetRoomName !== undefined) { 
        var roomPos = new RoomPosition(25, 25, creep.memory.targetRoomName);    
        if (roomPos !== undefined && roomPos !== null) {
            MoveBehaviour.movePath(creep, roomPos);          
            return;      
        }
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
        console.log(creep.name + ' found neutral: ' + neutralRooms.length);
        neutralRooms.sort( function(a, b) { return a.timeStamp - b.timeStamp } );
        creep.memory.targetRoomName = neutralRooms[0].name;
        return;
    } else if (myRooms.length > 0) {
        console.log(creep.name + ' found my rooms: ' + myRooms.length);
        myRooms.sort( function(a, b) { return a.timeStamp - b.timeStamp } );
        creep.memory.targetRoomName = myRooms[0].name;        
        return;
    }
    console.log(creep.name +  ' last room...');
    creep.memory.targetRoomName = creep.memory.lastRoomName;
}

module.exports = RoleScout;