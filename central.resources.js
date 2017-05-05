var MEMORY = 'CentralResoruces';
var Static = require('system.static');
var Utils = require('system.utils');
var Finder = require('system.finder');
var RoadsCentral = require('central.roads');
var BaseHQ = require('base.hq');
var ControllerBase = require('base.controller');
var ConstructionCentral = require('central.construction');


var ResourceCentral = {
    
    init: function(room) {
        if (room.memory.SYS[MEMORY] === undefined) {            
            room.memory.SYS[MEMORY] = {
                sources: scanSources(room),                
                age: 0
            };
        }
    },

    run: function(room) {
        ResourceCentral.init(room);
        var memory = getMemory(room);
        if (memory.age > 50) {
            memory.age = 0;
            updateSources(room);
        }
        memory.age++;        
    },    
    
    requestPioneerAssignment: function(creep) {
        var memory = getMemory(creep.room);
        var vacantSources = [];
        for (var sourceId in memory.sources) {
            var sourceObj = memory.sources[sourceId];
            if (sourceObj.assignments < sourceObj.capacity) {
                vacantSources.push(Game.getObjectById(sourceId));
            }
        }
        
        if (vacantSources.length == 0) {
            // Over capacity, assign random:
            return pickRandomSource(creep.room);            
        }
        return pickBestSource(creep, vacantSources);
    },
    
    requestHarvestAssignment: function(creep) {
        var memory = getMemory(creep.room);
        var vacantSources = [];
        for (var sourceId in memory.sources) {
            var sourceObj = memory.sources[sourceId];
            if (!sourceObj.isHarvesting) {
                sourceObj.isHarvesting = true;
                return { containerId: sourceObj.containerId, sourceId: sourceObj.id };
            }
        }
        
        return null;
    },       
    
   requestReplacementHarvester: function(creep, assignment) {
        if (Harvester.create(creep.room, assignment)) {
            creep.memory;
        } 
    },    
    
    requestResign: function(creep) {
        var memory = getMemory(creep.room);
        if (creep.memory.assignedToSourceId != undefined) {
            memory.sources[creep.memory.assignedToSourceId].assignments--;
        }
    }, 

    needPioneer: function(room) {
        return (countTotalPioneerAssignments(room) <= (Math.max(6, countTotalPioneerCapacity(room) * 1.5 )));
    },

    needHarvester: function(room) {
        var memory = getMemory(room);
        for (var sourceId in memory.sources) {
            var sourceObj = memory.sources[sourceId];
            if (!sourceObj.isHarvesting) {
                return true;
            }
        }        
        return false;
    },    
    
    countAvailablePioneerAssignments: function(room) {
        return countTotalPioneerCapacity(room) - countTotalPioneerAssignments(room);
    },
    
    countTotalPioneerCapacity: function(room) {
        return countTotalPioneerCapacity(room);
    },    
    
    getAllSources: function(room) {
        var memory = getMemory(room);
        return memory.sources;
    },  
    
    countSources: function(room) {
        var sources = ResourceCentral.getAllSources(room);
        return Utils.objListToArray(sources).length;
    }    
};

function updateSources(room) {
    var memory = getMemory(room);
    for (var sourceId in memory.sources) {
        var sourceObj = memory.sources[sourceId]; 
        var source = Game.getObjectById(sourceId);  
        sourceObj.assignments = countPioneerAssignments(room, sourceId);
        sourceObj.isHarvesting = isHarvesting(room, sourceId);
        sourceObj.containerId = Finder.findContainerId(source.pos, 1);
       if (sourceObj.containerId === null && !sourceObj.isContainerConstructed) {
            orderContainer(room, source.pos, 1);
            sourceObj.isContainerConstructed = true;
        }        
    }
}

function scanSources(room) {
    var sources = room.find(FIND_SOURCES);
    var sourceObjs = {};
    for (var i in sources) {
        var source = sources[i];        
        sourceObjs[source.id] = {
            id: source.id, 
            capacity: scanSourceCapacity(room, source), 
            assignments: 0, 
            isHarvesting: false,
            containerId: null,
            isContainerConstructed: false,
            distance: source.pos.findPathTo(room.firstSpawn()).length
        }; 
        orderRoads(room, source.pos);       
    }
    return sourceObjs;
}

function orderRoads(room, sourcePos) {
    var hqConnectionPair = RoadsCentral.findBestRoadConnections (
        room,
        BaseHQ.getRoadConnections(room),
        [sourcePos]
    );
    if (hqConnectionPair !== null) {
        RoadsCentral.placeOrder(room, hqConnectionPair.fromPos, hqConnectionPair.toPos);
    }

    var ctrlConnectionPair = RoadsCentral.findBestRoadConnections (
        room,     
        ControllerBase.getRoadConnections(room),
        [sourcePos]
    );
    if (ctrlConnectionPair !== null) {
        RoadsCentral.placeOrder(room, ctrlConnectionPair.fromPos, ctrlConnectionPair.toPos);      
    }
}

function scanSourceCapacity(room, source) {
    var tiles = room.lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
    var capacityCount = 0; 
    for (var j in tiles) {
        var tileObj = tiles[j];
        if (tileObj.type == 'terrain' && (tileObj.terrain == 'plain' || tileObj.terrain == 'swamp')) {
            capacityCount++;
        }
    } 
    return capacityCount;
}

function countTotalPioneerCapacity(room) {
    var memory = getMemory(room);
    var sumCapacity = 0;
    for (var sourceId in memory.sources) {
        var sourceObj = memory.sources[sourceId];
        sumCapacity += sourceObj.capacity;
    }
    return sumCapacity;    
}

function countTotalPioneerAssignments(room) {
    var memory = getMemory(room);
    var sumAssignments = 0;
    for (var sourceId in memory.sources) {
        var sourceObj = memory.sources[sourceId];
        sumAssignments += sourceObj.assignments;
    }
    return sumAssignments;    
}

// WORK ASSIGNMENT /////////////////////////////////////////////////////////////
// TODO: Move to a central?

function countPioneerAssignments(room, sourceId) {
    var assignments = [];
    var pioneers = room.find(FIND_MY_CREEPS, {
        filter: function(obj) {
            return (obj.memory.role == Static.ROLE_PIONEER);
        }
    });
    
    var count = 0;
    for (var i in pioneers) {
        var pioneer = pioneers[i];
        if (pioneer.memory.assignedToSourceId == sourceId) {
            count++;
        }
    }

    return count;
}

function isHarvesting(room, sourceId) {
    var assignments = [];
    var harvesters = room.find(FIND_MY_CREEPS, {
        filter: function(obj) {
            return (obj.memory.role == Static.ROLE_HARVESTER);
        }
    });
    
    for (var i in harvesters) {
        var harvester = harvesters[i];
        if (harvester.memory.assignedToSourceId == sourceId) {
            return true
        }
    }

    return false;
}

function pickRandomSource(room) {
    var memory = getMemory(room);
    var count = 0;
    var result = null;
    for (var key in memory.sources) {
        if (Math.random() < 1/++count) {
           result = key;
        }
    }
    memory.sources[result].assignments++;
    return result;
}

function pickBestSource(creep, vacantSources) {
    vacantSources.sort( function(a, b) { return a.distance - b.distance } );
    vacantSources[0].assignments++;
    return vacantSources[0].id;
}

// CONSTRUCTION ////////////////////////////////////////////////////////////////

function orderContainer(room, targetPos, dist) {
    var potentialTiles = [];
    var tiles = room.lookAtArea(targetPos.y - dist, targetPos.x - dist, targetPos.y + dist, targetPos.x + dist, true);
    for (var j in tiles) {
        var tileObj = tiles[j];
        if (tileObj.type == 'terrain' && (tileObj.terrain == 'plain' || tileObj.terrain == 'swamp')) {
            potentialTiles.push( room.getPositionAt(tileObj.x, tileObj.y) );
        }
    } 
    var bestPos = room.firstSpawn().pos.findClosestByPath(potentialTiles);
    ConstructionCentral.order(room, STRUCTURE_CONTAINER, bestPos);       
}

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}

module.exports = ResourceCentral;