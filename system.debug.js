var ConstructionCentral = require('central.construction');

var SystemDebug = { 

	paintConstructionQueue: function(room) {
		var orders = ConstructionCentral.getAllOrders(room);
		for (var i = 0; i < orders.length; i++) {
			paintOrder(room, orders[i]);
		}
	}	
};

function paintOrder(room, order) {

	switch(order.type) {

		case STRUCTURE_ROAD: 
			room.visual.circle(order.pos, {fill: '#aaaaaa', radius: 0.20} );
		break;

		case STRUCTURE_EXTENSION: 
			room.visual.circle(order.pos, {fill: '#ffd700', stroke: '#09db22', radius: 0.35} );
		break;

		case STRUCTURE_CONTAINER: 
			room.visual.rect(order.pos.x - 0.4, order.pos.y - 0.3, 0.8, 0.6, {fill: '#ffd700'} );
		break;	

		case STRUCTURE_STORAGE:
			room.visual.rect(order.pos.x - 0.5, order.pos.y - 0.5, 1.0, 1.0, {fill: '#ffd700'} );
		break;

		case STRUCTURE_TOWER:
			room.visual.rect(order.pos.x - 0.3, order.pos.y - 0.5, 0.6, 1.0, {fill: '#aa0000'} );
		break;		

		case STRUCTURE_WALL:
			room.visual.rect(order.pos.x - 0.5, order.pos.y - 0.5, 1.0, 1.0, {fill: '#000000'} );
		break;				


		default:
			console.log('Missing: ' + order.type);

	}
}

module.exports = SystemDebug;