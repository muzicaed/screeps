var MEMORY = 'ExtensionHQ';
var BaseFactory = require('factory.base');
var RoadsCentral = require('central.roads');
var BaseHQ = require('base.hq');

var BaseExtension = {

	init: function(room, idx) {
		if (room.memory.SYS[MEMORY] === undefined) {
			room.memory.SYS[MEMORY] = [];
		}
      	if (room.memory.SYS[MEMORY][idx] === undefined) {
      		var pos = BaseFactory.orderConstruction(room, blueprint, room.firstSpawn());
            room.memory.SYS[MEMORY][idx] = {
           		pos: pos,
           		roadConnections: prepareRoadConnections(room, pos),		
                age: 0
            };
            orderRoads(room, idx);            
            return pos;
        }
	},

	run: function(room, idx) {
		// TODO:
		console.log('Run: Extension base');
	} 
};

function prepareRoadConnections(room, centerPos) {
    var connections = [];
    connections.push(room.getPositionAt(centerPos.x, centerPos.y - 2));
    connections.push(room.getPositionAt(centerPos.x, centerPos.y + 2));
    connections.push(room.getPositionAt(centerPos.x - 2, centerPos.y));
    connections.push(room.getPositionAt(centerPos.x + 2, centerPos.y));
    return connections;
}

function orderRoads(room, idx) {
	var memory = getMemory(room, idx);
	var connectionPair = RoadsCentral.findBestRoadConnections (
        room,
		memory.roadConnections,
		BaseHQ.getRoadConnections(room)
	);
	if (connectionPair !== null) {
		RoadsCentral.placeOrder(room, connectionPair.fromPos, connectionPair.toPos);	
	}
}

function getMemory(room, idx) {
    return room.memory.SYS[MEMORY][idx];
}

var blueprint = {
    width: 5,
    height: 5,
    map: [
        '0','0','R','0','0',
		'0','R','E','R','0',
		'R','E','E','E','R',		
		'0','R','E','R','0',
		'0','0','R','0','0'
    ]
};

module.exports = BaseExtension;