var MEMORY = 'BaseHQ';
var BaseFactory = require('factory.base');
var Finder = require('system.finder');
var RoadsCentral = require('central.roads');
var Utils = require('system.utils');

var BaseHQ = {

	init: function(room) {
       if (room.memory.SYS[MEMORY] === undefined) {
            var spawn = room.firstSpawn();
            room.memory.SYS[MEMORY] = {
                hqId: spawn.id,
				baseContainers: scanBaseContainers(room),
                roadConnections: prepareRoadConnections(room, spawn.pos),
				pos: spawn.pos,
				level: 1
            };
            BaseFactory.placeConstructionOrders(room, blueprint, spawn.pos);
        }
	},

	run: function(room) {
        var memory = getMemory(room);
        memory.baseContainers = scanBaseContainers(room);
        handleBaseLevel2(room);
        handleRebuild(room);
	},

    getAllBaseContainers: function(room) {
        var memory = getMemory(room);
        return memory.baseContainers;
    },  

    currentBaseEnergy: function(room) {
        var totalEnergy = 0;
        var baseContainers = getMemory(room).baseContainers;
        for(var i = 0; i <  baseContainers.length; i++) {
            var container = Game.getObjectById(baseContainers[i]);
            if (container !== null) {
                totalEnergy += container.store.energy;
            }
        }
        if (room.storage !== undefined) {
            totalEnergy += room.storage.store.energy;
        }
        return totalEnergy;
    },

    getRoadConnections(room) {
        var memory = getMemory(room);
        return memory.roadConnections;
    },

    getId(room) {
        var memory = getMemory(room);
        return memory.hqId;        
    },

    getOpimalBaseLocation(room) {
        return BaseFactory.findBaseLocation(room, blueprint, room.getPositionAt(25, 25));
    }
};

function scanBaseContainers(room) {
    var spwan = room.firstSpawn();
    var containers = Finder.findContainersInRange(spwan.pos, 3);
    return Utils.createIdArray(containers);
}

function prepareRoadConnections(room, centerPos) {
    var connections = [];
    connections.push(room.getPositionAt(centerPos.x - 3, centerPos.y - 3));
    connections.push(room.getPositionAt(centerPos.x + 3, centerPos.y - 3));
    connections.push(room.getPositionAt(centerPos.x - 3, centerPos.y));
    connections.push(room.getPositionAt(centerPos.x + 3, centerPos.y));    
    connections.push(room.getPositionAt(centerPos.x - 3, centerPos.y + 3));
    connections.push(room.getPositionAt(centerPos.x + 3, centerPos.y + 3));
    return connections;
}

function handleBaseLevel2(room) {
    var memory = getMemory(room);
    if (room.controller.level >= 5 && memory.level == 1) {
        BaseFactory.placeConstructionOrders(room, blueprint2, memory.pos);
        memory.level = 2;
    }    
}

function handleRebuild(room) {
    var memory = getMemory(room);
    if (Game.time % 30 == 0) {
        BaseFactory.placeConstructionOrders(room, blueprint, memory.pos);
        if (memory.level > 1) {
            BaseFactory.placeConstructionOrders(room, blueprint2, memory.pos);
        }
    }
}

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}


var blueprint = {
    width: 7,
    height: 7,
    map: [
        'R','W','W','0','W','W','R',
        'W','R','E','C','E','R','W',
        'W','0','R','R','R','0','W',
        'W','T','R','0','R','1','W',
        'W','E','R','R','R','0','W',
        'W','R','E','C','E','R','W',
        'R','W','W','R','W','W','R' 
    ]
};

var blueprint2 = {
    width: 7,
    height: 7,
    map: [
        '2','0','0','2','0','0','2',
        '0','0','0','R','0','0','0',
        '0','0','0','0','0','T','0',
        '0','0','0','0','0','0','0',
        '0','0','0','0','0','4','0',
        '0','0','0','R','0','0','0',
        '2','0','0','2','0','0','2'
    ]
};


module.exports = BaseHQ;