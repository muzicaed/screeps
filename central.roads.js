    
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
        RoadsCentral.init(room);
        var memory = getMemory(room);        
        if (memory.count > 25) {
            memory.count = 0;
            garbageCollect(room);
            if (refreshRoadsStatus(room)) {                
                buildRoads(room);    
            }
        }
        memory.count++;
    },
    
    placeOrder: function(room, fromPos, toPos) {
        var memory = getMemory(room);
        RoadsCentral.init(room);
        if (!isRoadExists(room, fromPos, toPos)) {
            var id = createRoadId(room, fromPos, toPos);     
            memory.roadQueue[id] = {
                fromPos: fromPos,
                toPos: toPos,
                path: [],
                isDone: false,
                age: 0
           };
        }
        return null;
    },

    findBestRoadConnections(room, fromConnections, toConnections) {
        var bestConnectionPair = null;
        var bestDistance = 50000;       
        for (var i = 0; i < fromConnections.length; i++) {
            var fromConn = new RoomPosition(fromConnections[i].x, fromConnections[i].y, fromConnections[i].roomName);
            for (var j = 0; j < toConnections.length; j++) {
                var toConn = new RoomPosition(toConnections[j].x, toConnections[j].y, toConnections[j].roomName);
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
            var fromPos = new RoomPosition(road.fromPos.x, road.fromPos.y, road.fromPos.roomName);
            var toPos = new RoomPosition(road.toPos.x, road.toPos.y, road.toPos.roomName);
            var path = PathFinder.search(fromPos, toPos, { 
                swampCost: 1,
                roomCallback: function(roomName) {
                    let room = Game.rooms[roomName];
                    if (!room) return;
                    let costs = new PathFinder.CostMatrix;
                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                      if (struct.structureType === STRUCTURE_ROAD) {
                        costs.set(struct.pos.x, struct.pos.y, 1);
                      } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                                 (struct.structureType !== STRUCTURE_RAMPART ||
                                  !struct.my)) {
                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                      }
                    });
                    room.find(FIND_CREEPS).forEach(function(creep) {
                      costs.set(creep.pos.x, creep.pos.y, 0);
                    });
                    return costs;
                },                
            }).path;
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
    for (var i = 0; i < structures.length; i++) {
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
            if ((!segment.isDone && !segment.isPlaced) || segment.age > 20) {
                ConstructionCentral.order(room, STRUCTURE_ROAD, room.getPositionAt(segment.x, segment.y));
                segment.age = 0;
            }
            segment.age++;
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
    return fromPos.roomName + '-' + fromPos.x + '-' + fromPos.y + '-' + fromPos.roomName + '-' + toPos.x + '-' + toPos.y;
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
    for (i = 0; i < path.length - 1; i++) {
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

function garbageCollect(room) {
    var roadQueue = getMemory(room).roadQueue;
    for (var id in roadQueue) {
        if (roadQueue[id].isDone) {
            delete roadQueue[id];
        }
    }
}

function getMemory(room) {
    return room.memory.SYS[MEMORY];    
}

module.exports = RoadsCentral;