    
var MEMORY = "CentralRoads";
var ConstructionCentral = require('central.construction');
var Finder = require('system.finder');
var Utils = require('system.utils');

var RoadsCentral = {
    
    init: function(room) {
        if (room.memory.SYS[MEMORY] === undefined || room.memory.SYS[MEMORY] === null) {
            room.memory.SYS[MEMORY] = {
                roadQueue: {},
                count: 0
            };
        }
    },

    run: function(room) {
        var memory = getMemory(room);        
        if (memory.count > 25) {
            memory.count = 0;
            if (refreshRoadsStatus(room)) {                
                buildRoads(room);    
            }
        }
        memory.count++;
    },
    
    placeOrder: function(room, fromPos, toPos) {
        console.log('Place order.');
        var memory = getMemory(room);
        if (!isRoadExists(room, fromPos, toPos)) {
            var id = createRoadId(room, fromPos, toPos);     
            memory.roadQueue[id] = {
                fromPos: fromPos,
                toPos: toPos,
                path: [],
                isDone: false
           };

        }
        return null;
    },

    findBestRoadConnections(room, fromConnections, toConnections) {
        var bestConnectionPair = null;
        var bestDistance = 50000;       
        for (var i = 0; i < fromConnections.length; i++) {
            var fromConn = room.getPositionAt(fromConnections[i].x, fromConnections[i].y);
            for (var j = 0; j < toConnections.length; j++) {
                var toConn = room.getPositionAt(toConnections[j].x, toConnections[j].y);
                var distance = fromConn.getRangeTo(toConn);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestConnectionPair = { fromPos: fromConn, toPos: toConn };
                }
            }
        }

        return bestConnectionPair;
    }             
};

function refreshRoadsStatus(room) {
    var isNeedRoadWork = false;
    var road = findCurrentRoad(room);
    if (road !== null && !road.isDone) {
        if (road.path.length == 0) {
            var fromPos = room.getPositionAt(road.fromPos.x, road.fromPos.y);
            var path = fromPos.findPathTo(road.toPos.x, road.toPos.y, { ignoreCreeps: true, ignoreDestructibleStructures: false, ignoreRoads: false });       
            road.path = convertPath(path);
        }        
        road.isDone = true;
        for(var j = 0; j < road.path.length; j++) {
            var segment = road.path[j];
            segment.isPlaced = checkRoadConstruction(room, segment);
            segment.isDone = false;
            if (checkRoadDone(room, segment)) {
                segment.isPlaced = true;
                segment.isDone = true;
            } else if (!segment.isPlaced || !segment.isDone) {
                road.isDone = false;
                isNeedRoadWork = true;
            }
        }
    }

    return isNeedRoadWork;
}

function checkRoadConstruction(room, segment) {
    var isConstructionSite = (room.lookForAt(LOOK_CONSTRUCTION_SITES, segment.x, segment.y).length > 0);
    var isFlagged = (room.lookForAt(LOOK_FLAGS, segment.x, segment.y).length > 0);
    return (isConstructionSite || isFlagged);
}

function checkRoadDone(room, segment) {
    var structures = room.lookForAt(LOOK_STRUCTURES, segment.x, segment.y);
    for(var i = 0; i < structures.length; i++) {
        if (structures[i].structureType != STRUCTURE_CONTAINER) {
            return true;
        }
    }
    return false
}

function buildRoads(room) {
    var road = findCurrentRoad(room);
    if (road !== null && road.path.length > 0) {
        for(var i = 0; i < road.path.length; i++) {
            var segment = road.path[i];
            if (!segment.isDone && !segment.isPlaced) {
                ConstructionCentral.order(room, STRUCTURE_ROAD, room.getPositionAt(segment.x, segment.y));
            }
        }
    }
}

function findCurrentRoad(room) {
    var roads = Utils.objListToArray(getMemory(room).roadQueue);
    for (var i = 0; i < roads.length; i++) {
        if (!roads[i].isDone) {
            return roads[i];
        }
    }
    return null;
}

function createRoadId(room, fromPos, toPos) {
    return room.name + '-' + fromPos.x + '-' + fromPos.y + '-' + toPos.x + '-' + toPos.y;
}

function isRoadExists(room, fromPos, toPos) {
    var memory = getMemory(room);
    var id = createRoadId(room, fromPos, toPos);
    if (memory.roadQueue[id] === undefined || memory.roadQueue[id] === null) {
        return false;
    }
    return true;
}

function convertPath(path) {
    var newPath = [];
    for(i = 0; i < path.length - 1; i++) {
        var segment = {
            x: path[i].x,
            y: path[i].y,
            isPlaced: false,
            isDone: false
        };
        newPath.push(segment);
    }
    return newPath;
}

function getMemory(room) {

    return room.memory.SYS[MEMORY];    
}

module.exports = RoadsCentral;