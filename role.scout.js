/// Manual create transporter
/// Game.spawns['Home'].createCreep( [CARRY, CARRY, MOVE, MOVE, MOVE], null, {role: 'TRANSPORTER'} );

var Static = require('system.static');
var CreepFactory = require('factory.creep');
var MoveBehaviour = require('behaviour.move');
var Utils = require('system.utils');

var RoleScout = {
    run: function(creep) {
        var action = think(creep);
        switch(action) {
            case 'FIND_SCOUT_TARGET':
                doFindScoutTarget(creep);
                creep.memory.state = 'SCOUT';
                break;            
            case 'SCOUT':
                doScout(creep);
                break;              
            case 'REPORT':
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
    if (creep.room.name != creep.memory.lastRoomName) {
        return 'REPORT';
    } else if (creep.memory.state == 'REPORT') {
        return 'FIND_SCOUT_TARGET';
    }
    return creep.memory.state;
}

function applyNewState(creep, newState) {
    //console.log(creep.name + ' new state: ' + newState);
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
    console.log('doFindScoutTarget');
    var neutralRooms = [];
    var myRooms = [];

    var exits = Game.map.describeExits(creep.room.name);
    console.log(JSON.stringify(exits));
    for (var i in exits) {
        var roomName = exits[i];
        if (roomName != creep.memory.lastRoomName) {
            switch(getRoomState(roomName)) {
                case Static.EXPLORE_UNKNOWN:
                    console.log('UNKNOWN');
                    creep.memory.targetRoomName = roomName;                                        
                    if (creep.memory.targetRoomName !== null) {
                        var roomPos = new RoomPosition(25, 25, creep.memory.targetRoomName);   
                         MoveBehaviour.movePath(creep, roomPos);    
                    }                     
                    return;
                    break;
                case Static.EXPLORE_MY_CONTROL:
                    console.log('my room');
                    myRooms.push(roomName);
                    break;
                case Static.EXPLORE_NEUTRAL:
                    console.log('neutral room');
                    neutralRooms.push(roomName);
                    break;
                case Static.EXPLORE_ENEMY:                
                    // Do not explore
                    break;
            }
        }
    }

    pickBestTargetRoom(creep, neutralRooms, myRooms);    
    var roomPos = new RoomPosition(25, 25, creep.memory.targetRoomName);   
    MoveBehaviour.movePath(creep, roomPos); 
}

function doScout(creep) {
    var roomPos = new RoomPosition(25, 25, creep.memory.targetRoomName);    
    if (roomPos !== undefined && roomPos !== null) {
        MoveBehaviour.movePath(creep, roomPos);  
        return;      
    }
    creep.memory.state = 'FIND_SCOUT_TARGET';
}

function doReport(creep) {
    console.log('doReport');
    var room = creep.room;
    generateReport(room);
    if (creep.memory.targetRoomName !== null) {
        var roomPos = new RoomPosition(25, 25, creep.memory.targetRoomName);        
        MoveBehaviour.movePath(creep, roomPos);    
    }  
    creep.memory.lastRoomName = creep.room.name;
}

function pickBestTargetRoom(creep, neutralRooms, myRooms) {
    if (neutralRooms.length > 0) {
        creep.memory.targetRoomName = neutralRooms[0];
        return;
    } else if (myRooms.length > 0) {
        creep.memory.targetRoomName = myRooms[0];
    }
    creep.memory.targetRoomName = creep.memory.lastRoomName;
}

function getRoomState(roomName) {
    
    var report = Memory.scoutReports[roomName];
    if (report === undefined || report.exporeState === undefined) {
        console.log('getRoomState: UNKNOWN');
        return Static.EXPLORE_UNKNOWN;
    }
    console.log('getRoomState:' + report.exporeState);
    return report.exporeState;
}

function generateReport(room) {        
    console.log('Full report: ' + room.name);
    Memory.scoutReports[room.name] = {
        'type': checkRoomType(room),
        'sources': findSources(room),
        'enemyReport': generateEnemyReport(room),
        'typeOfMineral': findMineral(room)
    };
    Memory.scoutReports[room.name].exporeState = checkRoomState(room, Memory.scoutReports[room.name]);    
}

function checkRoomType(room) {
    if (room.controller !== undefined) {
        return Static.EXPLORE_TYPE_CONTROLLER_SOURCE;
    }
    return Static.EXPLORE_TYPE_SOURCE_ONLY;
}

function findSources(room) {
    var sources = room.find(FIND_SOURCES);
    return Utils.createIdArray(sources);
}

function findMineral(room) {
    var mineral = room.find(FIND_MINERALS);
    if (mineral.length > 0) {
        return mineral[0].mineralType;
    }
    return null;
}

function generateEnemyReport(room) {
    return {
        'controllerLevel': (room.controller !== undefined) ? room.controller.level : null,
        'enemyTowers': findEnemyTowers(room),
        'enemySpawns': room.find(FIND_HOSTILE_SPAWNS).length,
        'enemyNukes': room.find(FIND_NUKES).length
    };
}

function checkRoomState(room, report) {
    if (room.controller !== undefined && room.controller.my) {
        return Static.EXPLORE_MY_CONTROL;
    } else if (room.controller !== undefined && report.enemyReport.enemySpawns > 0) {
        return Static.EXPLORE_ENEMY_CONTROL;
    } else if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
        return Static.EXPLORE_ENEMY_OPERATION;
    } else if (room.find(FIND_MY_CREEPS).length > 2) {
        return Static.EXPLORE_MY_OPERATION;
    }
    return Static.EXPLORE_NEUTRAL;
}

function findEnemyTowers(room) {
    var towers = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: { structureType: STRUCTURE_TOWER }
    });  
    return towers.length;  
}

module.exports = RoleScout;