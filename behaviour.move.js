
var MoveBehaviour = {
    
    movePath: function(creep, destination) {  
		setup(creep, destination);
		handlePath(creep, destination)
		if (creep.fatigue == 0) { 					
			var res = creep.moveByPath(creep.memory.moveData.movePath)
			switch(res) {
				case OK:
					creep.memory.moveData.lastFatigue = creep.fatigue;
					creep.memory.moveData.lastPos = creep.pos;		
					creep.memory.moveData.lastDestinationId = destination.id;
					break;		

				case ERR_NOT_FOUND:
					creep.moveTo(destination);
					creep.memory.moveData.lastDestinationId = null;
					break;
			}				
		}
    }
};

function handlePath(creep, destination) {
	var lastPos = creep.memory.moveData.lastPos;
	if (creep.memory.moveData.lastDestinationId !== destination.id) {
		creep.memory.moveData.movePath = creep.pos.findPathTo(destination, { ignoreCreeps: true });	
	} else if (creep.pos.x == lastPos.x && creep.pos.y == lastPos.y) {	
		creep.memory.moveData.movePath = creep.pos.findPathTo(destination, { ignoreCreeps: false });	
	}
}

function setup(creep, destination) {
    if (creep.memory.moveData === undefined || creep.memory.moveData === null) {
		creep.memory.moveData = {
			movePath: null,
			lastFatigue: 0, 
			lastPos: { x: null, y: null },
			lastDestinationId: null,
			notFoundCount: 0
		}
	}
}

module.exports = MoveBehaviour;