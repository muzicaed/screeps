
var ClaimOperationManager = require('operation.manager.claim');
var HarvestOperationManager = require('operation.manager.harvest');
var Static = require('system.static');
var Utils = require('system.utils');

var OperationManager = {
    init: function() {
        if (Memory.operations === undefined || Memory.operations === null) {
            Memory.operations = {
                possibleOperations: {
                    claim: {},
                    harvest: {},
                    mine: {},
                    aid: {}
                },
                activeOperations: {
                    claim: {},
                    harvest: {},
                    mine: {},
                    aid: {}
                },
                count: 0
            };
        }
        if (Memory.scoutReports === undefined || Memory.scoutReports === null) {
            Memory.scoutReports = {};
        }        
    },  

    run: function() {
        OperationManager.init();
        var memory = getOperationsMemory();        
        if (memory.count > 100) {
            memory.count = 0;
            processOperations();
        }
        runActiveOperations();
        memory.count++;        
    },

    processScoutReport(room) {    
        var reports = getScoutReportsMemory();
        reports[room.name] = {
            'type': checkRoomType(room),
            'sources': findSources(room),
            'controllerId': findControllerId(room),
            'enemyReport': generateEnemyReport(room),
            'typeOfMineral': findMineral(room),
            'timeStamp': Game.time
        };
        reports[room.name].exporeState = checkRoomState(room, reports[room.name]);    

        // Sort
        reports = Object.keys(reports).sort().reduce((r, k) => (r[k] = reports[k], r), {});
        placeScoutFlag(room, reports);
    },

    needReport: function(room) {
        var reports = getScoutReportsMemory();
        if (reports[room.name] !== undefined) {
            return (Game.time > reports[room.name].timeStamp + 3000);
        }
        return true;
    },

    getRoomExploreState: function(roomName) {    
        var report = getScoutReportsMemory()[roomName];
        if (report === undefined || report.exporeState === undefined) {
            return Static.EXPLORE_UNKNOWN;
        }
        return report.exporeState;
    },  
    getRoomExploreTimeStamp: function(roomName) {    
        var report = getScoutReportsMemory()[roomName];
        if (report === undefined || report.timeStamp === undefined) {
            return 0;
        }
        return report.timeStamp;
    },    
};

function runActiveOperations() {
    for (var i = 0; i < operationManagerObjects.length; i++) {
        operationManagerObjects[i].run();
    }
}

function processOperations() {
    var reports = getScoutReportsMemory();
    for (var i = 0; i < operationManagerObjects.length; i++) {
        operationManagerObjects[i].processReports(reports);
    }
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

function findControllerId(room) {
    if (room.controller !== undefined) {
        return room.controller.id;
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

function findMineral(room) {
    var mineral = room.find(FIND_MINERALS);
    if (mineral.length > 0) {
        return mineral[0].mineralType;
    }
    return null;
}

function findEnemyTowers(room) {
    var towers = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: { structureType: STRUCTURE_TOWER }
    });  
    return towers.length;  
}

function checkRoomState(room, report) {
    var myCreeps = room.find(FIND_MY_CREEPS, {
        filter: function(obj) {
            obj.memory.role != Static.ROLE_SCOUT
        }
    });

    if (room.controller !== undefined && room.controller.my) {
        return Static.EXPLORE_MY_CONTROL;
    } else if (room.controller !== undefined && report.enemyReport.enemySpawns > 0) {
        return Static.EXPLORE_ENEMY_CONTROL;
    } else if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
        return Static.EXPLORE_ENEMY_OPERATION;
    } else if (myCreeps > 1) {
        return Static.EXPLORE_MY_OPERATION;
    }
    return Static.EXPLORE_NEUTRAL;
}

function placeScoutFlag(room, reports) {
    var flagName = room.name + '-scout-report';
    delete Game.flags[flagName];
    var res = room.createFlag(new RoomPosition(25, 25, room.name), flagName);
    if (res !== ERR_NAME_EXISTS && res !== ERR_INVALID_ARGS) {
        Game.flags[flagName].memory.scoutReport = reports[room.name];     
    }
}

function getOperationsMemory() {
    return Memory.operations;    
}

function getScoutReportsMemory() {
    return Memory.scoutReports;    
}

var operationManagerObjects = [
    ClaimOperationManager,
    HarvestOperationManager
];

module.exports = OperationManager;