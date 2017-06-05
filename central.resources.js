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
        if (memory.age > 40) {
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
    
    requestTransportAssignment: function(room) {
        var memory = getMemory(room);
        for (var sourceId in memory.sources) {
            var sourceObj = memory.sources[sourceId];
            var container = Game.getObjectById(sourceObj.containerId);
            if (container.store.energy > 1200) {
                return container.id;
            }
        }        
        return null;
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
    
    needTransporter: function(room) {
        if (ResourceCentral.requestTransportAssignment(room) === null) {
            return (
                Finder.countRole(room, Static.ROLE_TRANSPORTER) < 1 &&
                Finder.countRole(room, Static.ROLE_CIV_TRANSPORTER) < 1 
            );
        }
        return true;
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
        updateConstruction(room, sourceObj);    
    }
}

function updateConstruction(room, sourceObj) {
    var source = Game.getObjectById(sourceObj.id);
    var hasContainerConstructionSite = checkContainerConstruction(source.pos);
    var isInQueue = ConstructionCentral.checkOrder(room, sourceObj.containerPos, STRUCTURE_CONTAINER);
    if (sourceObj.containerId === null && !hasContainerConstructionSite && !isInQueue) {
        ConstructionCentral.order(room, STRUCTURE_CONTAINER, sourceObj.containerPos);
        orderRoads(room, sourceObj.containerPos); 
    }    
}

function checkContainerConstruction(pos) {
    var sites = pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
        filter: function(obj) { return (obj.structureType == STRUCTURE_CONTAINER) }
    });
    return (sites.length > 0);
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
            containerPos: scanContainerPos(room, source),
            distance: source.pos.findPathTo(room.firstSpawn()).length
        }; 
    }
    return sourceObjs;
}

function scanContainerPos(room, source) {
    var dist = 1;
    var targetPos = source.pos;
    var potentialTiles = [];
    var tiles = room.lookAtArea(targetPos.y - dist, targetPos.x - dist, targetPos.y + dist, targetPos.x + dist, true);
    for (var j in tiles) {
        var tileObj = tiles[j];
        if (tileObj.type == 'terrain' && (tileObj.terrain == 'plain' || tileObj.terrain == 'swamp')) {
            potentialTiles.push( room.getPositionAt(tileObj.x, tileObj.y) );
        }
    } 
    var bestPos = room.firstSpawn().pos.findClosestByPath(potentialTiles);
    return bestPos;        
}

function orderRoads(room, containerPos) {
    var hqConnectionPair = RoadsCentral.findBestRoadConnections (
        room,
        BaseHQ.getRoadConnections(room),
        [containerPos]
    );
    if (hqConnectionPair !== null) {
        RoadsCentral.placeOrder(room, hqConnectionPair.fromPos, hqConnectionPair.toPos);
    }

    var ctrlConnectionPair = RoadsCentral.findBestRoadConnections (
        room,     
        ControllerBase.getRoadConnections(room),
        [containerPos]
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

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}

module.exports = ResourceCentral;