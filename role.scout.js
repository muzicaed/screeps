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
            case 'SCOUT':
                doScout(creep);
                break;              
            case 'REPORT': 
                doReport(creep);
                doFindScoutTarget(creep); 
                doScout(creep);
                break;                 
        }  
    },
    
    create: function(room) {
        var newCreep = CreepFactory.create(room, Static.ROLE_SCOUT, 'REPORT');
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            newCreep.memory.lastRoomName = null;
            newCreep.memory.targetRoomName = null;
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
    creep.memory.state = 'REPORT';
}

function doReport(creep) {
    var room = creep.room;
    if (OperationManager.needReport(room)) {   
        OperationManager.processScoutReport(room);
    }
    creep.memory.lastRoomName = room.name;
}

function pickBestTargetRoom(creep, neutralRooms, myRooms) {
    if (neutralRooms.length > 0) {
        neutralRooms.sort( function(a, b) { return a.timeStamp - b.timeStamp } );
        creep.memory.targetRoomName = neutralRooms[0].name;
        return;
    } else if (myRooms.length > 0) {
        myRooms.sort( function(a, b) { return a.timeStamp - b.timeStamp } );
        creep.memory.targetRoomName = myRooms[0].name;        
        return;
    }
    creep.memory.targetRoomName = creep.memory.lastRoomName;
}

module.exports = RoleScout;