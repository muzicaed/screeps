var MEMORY = 'BaseController';
var Finder = require('system.finder');
var BaseFactory = require('factory.base');
var RoadsCentral = require('central.roads');
var BaseHQ = require('base.hq');
var Static = require('system.static');

var ControllerBase = {

	init: function(room) {
       if (room.memory.SYS[MEMORY] === undefined) {
       		var pos = BaseFactory.orderConstruction(room, blueprint, room.controller.pos);
            room.memory.SYS[MEMORY] = {
				controllerContainerId: Finder.findContainerId(room.controller.pos, 2),
				roadConnections: prepareRoadConnections(room, pos),
				pos: pos
            };
            orderRoads(room);
        }
	},

	run: function(room) {
		var memory = getMemory(room);
		memory.controllerContainerId = Finder.findContainerId(room.controller.pos, 2);
	},

    getControllerContainerId: function(room) {
        var memory = getMemory(room);
        return memory.controllerContainerId;
    },

	getRoadConnections(room) {
        var memory = getMemory(room);
        return memory.roadConnections;
    },

	hasPumpNeed: function(room) {
	    var memory = getMemory(room);
	    var count = Finder.countRole(room, Static.ROLE_PUMP)
	    var container = Game.getObjectById(memory.controllerContainerId);
	    if (container === null || container.store.energy == 0) {
	        return false;
		} else if (room.energyCapacityAvailable >= 1500) {
			return count < 1;
		} else if (room.energyCapacityAvailable >= 800) {
			return count < 2;
		} 
		return count < 3;
	}
};

function orderRoads(room) {
	var memory = getMemory(room);
	var connectionPair = RoadsCentral.findBestRoadConnections (
		room,
		memory.roadConnections,
		BaseHQ.getRoadConnections(room)
	);
	if (connectionPair !== null) {
		RoadsCentral.placeOrder(room, connectionPair.fromPos, connectionPair.toPos);	
	}
}

function prepareRoadConnections(room, centerPos) {
    var connections = [];
    connections.push(room.getPositionAt(centerPos.x, centerPos.y - 1));
    connections.push(room.getPositionAt(centerPos.x, centerPos.y + 1));
    connections.push(room.getPositionAt(centerPos.x - 1, centerPos.y));
    connections.push(room.getPositionAt(centerPos.x + 1, centerPos.y));
    return connections;
}

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}

var blueprint = {
    width: 3,
    height: 3,
    map: [
		'R','R','R',
		'R','C','R',
		'R','R','R'
    ]
};

module.exports = ControllerBase;