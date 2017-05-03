var Static = require('system.static');
var Society = require('central.society');

var ClaimOperationManager = {

	processReports: function(reports) {		
		for (var id in reports) {
			processReport(id, reports[id]);
		}
		activateOperations();	
	}
};

function processReport(roomName, report) {
	var possibleOperationsMemory = getPossibleOperationsMemory();
    if (isNewClaimTarget(roomName, report)) {    	
    	var closestRoomName = closestCizilizationRoom(roomName);
    	var distance = Game.map.getRoomLinearDistance(roomName, closestRoomName);
    	if (distance <= 3) {
			console.log('New claim operation added: ' + closestRoomName + ' -> ' + roomName);
			possibleOperationsMemory[roomName] = {
				ownerRoom: closestRoomName,
				targetRoom: roomName,
				distance: distance
			};		
    	}
    }    
}

function activateOperations() {
	var possibleOperationsMemory = getPossibleOperationsMemory();
}

function isNewClaimTarget(roomName, report) {
	var possibleOperationsMemory = getPossibleOperationsMemory();
	var activeOperations = getActiveOperationsMemory();
	return (
		possibleOperationsMemory[roomName] === undefined &&
		activeOperations[roomName] === undefined &&
		Memory.myActiveRooms[roomName] === undefined &&
		report.type == Static.EXPLORE_TYPE_CONTROLLER_SOURCE &&
		report.sources.length >= 2		
	);
}

function closestCizilizationRoom(targetRoomName) {
	var closestDistance = 100000;
	var closestRoomName = null;
	for (var roomName in Memory.myActiveRooms) {
		var room = Game.rooms[roomName];
		var distance = Game.map.getRoomLinearDistance(roomName, targetRoomName);
		if (distance < closestDistance && Society.getLevel(room) >= Static.SOCIETY_LEVEL_CIVILIZATION) {
			closestDistance = distance;
			closestRoomName = roomName;
		}
	}
	return closestRoomName;
}

function getPossibleOperationsMemory() {
    return Memory.operations.possibleOperations.claim;    
}

function getActiveOperationsMemory() {
    return Memory.operations.activeOperations.claim;    
}


module.exports = ClaimOperationManager;