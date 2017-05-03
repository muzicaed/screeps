var MEMORY = 'BaseHQ';
var BaseFactory = require('factory.base');
var Finder = require('system.finder');
var Utils = require('system.utils');

var BaseHQ = {

	init: function(room) {
       if (room.memory.SYS[MEMORY] === undefined) {
            var spawn = room.firstSpawn();
            room.memory.SYS[MEMORY] = {
				baseContainers: scanBaseContainers(room),
                roadConnections: prepareRoadConnections(room, spawn.pos),
				pos: spawn.pos
            };
            BaseFactory.placeConstructionOrders(room, blueprint, spawn.pos);
        }
	},

	run: function(room) {
        console.log('Run: BaseHQ');
        var memory = getMemory(room);
        memory.baseContainers = scanBaseContainers(room);
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
        return totalEnergy;
    },

    getRoadConnections(room) {
        var memory = getMemory(room);
        return memory.roadConnections;
    },

	getStats(room) {
		return {
			baseContainers: BaseHQ.getAllBaseContainers(room).length
		};
	}
};

function scanBaseContainers(room) {
    var spwan = room.firstSpawn();
    var containers = Finder.findContainersInRange(spwan.pos, 3);
    if (room.storage !== undefined && room.storage.isActive()) {
        containers.push(room.storage);  
    }
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

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}


var blueprint = {
    width: 7,
    height: 7,
    map: [
        'R','W','W','R','W','W','R',
        'W','R','E','C','E','R','W',
        'W','O','R','R','R','3','W',
        'W','T','R','0','R','1','W',
        'W','E','R','R','R','4','W',
        'W','R','E','C','E','R','W',
        'R','W','W','R','W','W','R'
    ]
};


module.exports = BaseHQ;