
var ClaimOperationManager = require('operation.manager.claim');
var HarvestOperationManager = require('operation.manager.harvest');
var ClaimOperation = require('operation.claim');
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
        if (memory.count > 1) {
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
            'enemyReport': generateEnemyReport(room),
            'typeOfMineral': findMineral(room),
            'timeStamp': Game.time
        };
        reports[room.name].exporeState = checkRoomState(room, reports[room.name]);    
    },

    getRoomExploreState: function(roomName) {    
        var report = getScoutReportsMemory()[roomName];
        if (report === undefined || report.exporeState === undefined) {
            return Static.EXPLORE_UNKNOWN;
        }
        return report.exporeState;
    }       
};

function runActiveOperations() {
    for (var i = 0; i < operationObjects.length; i++) {
        operationObjects[i].run();
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

function getOperationsMemory() {
    return Memory.operations;    
}

function getScoutReportsMemory() {
    return Memory.scoutReports;    
}

var operationObjects = [
    ClaimOperation
];

var operationManagerObjects = [
    ClaimOperationManager,
    HarvestOperationManager
];

module.exports = OperationManager;