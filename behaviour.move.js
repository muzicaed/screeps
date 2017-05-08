
var MoveBehaviour = {
    
	setup: function(creep) {
	 	if (creep.memory.moveData === undefined || creep.memory.moveData === null) {
			creep.memory.moveData = {
				movePath: null,
				lastFatigue: 0, 
				lastPos: { x: null, y: null },
				lastDestinationId: null,
				notFoundCount: 0
			}
		}
	},

    movePath: function(creep, destination) {  
		handlePath(creep, destination)
		if (creep.fatigue == 0) { 					
			var res = creep.moveByPath(creep.memory.moveData.movePath);
			switch(res) {

				case OK:
					creep.memory.moveData.lastFatigue = creep.fatigue;
					creep.memory.moveData.lastPos = creep.pos;		
					creep.memory.moveData.lastDestinationId = generateDestinationId(destination);		
					break;		

				case ERR_NOT_FOUND:
					creep.moveTo(destination);
					creep.memory.moveData.lastDestinationId = null;
					return;
					break;
			}				
		}
    }
};

function handlePath(creep, destination) {
	var lastPos = creep.memory.moveData.lastPos;
	if (creep.memory.moveData.lastDestinationId !== generateDestinationId(destination)) {
		creep.memory.moveData.movePath = creep.pos.findPathTo(destination, { ignoreCreeps: true });	
		console.log('MoveBehaviour: .findPathTo()');
	} else if (creep.pos.x == lastPos.x && creep.pos.y == lastPos.y && creep.memory.moveData.lastFatigue == 0) {	
		creep.memory.moveData.movePath = creep.pos.findPathTo(destination, { ignoreCreeps: false });	
		console.log('MoveBehaviour: .findPathTo()');
	}
}

function generateDestinationId(destination) {
	if (destination.x !== undefined && destination.y !== undefined && destination.roomName !== undefined) {
		return destination.x + '-' + destination.y + '-' + destination.roomName;

	}
	return destination.id;
}

module.exports = MoveBehaviour;