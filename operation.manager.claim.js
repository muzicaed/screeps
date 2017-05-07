var Static = require('system.static');
var Society = require('central.society');
var ClaimOperation = require('operation.claim');

var ClaimOperationManager = {

	processReports: function(reports) {		
		for (var id in reports) {
			processReport(id, reports[id]);
		}
		activateOperation();
		removeCompleetedOperations();	
	},

	run: function() {
		var activeOperations = getActiveOperationsMemory();
		for (var roomName in activeOperations) {
			ClaimOperation.run(activeOperations[roomName]);
		}
	}	
};

function processReport(roomName, report) {
	var possibleOperationsMemory = getPossibleOperationsMemory();
    if (isNewClaimTarget(roomName, report)) {    	
    	var closestRoomName = closestCizilizationRoom(roomName);
    	if (closestRoomName !== null) {
	    	var path = Game.map.findRoute(roomName, closestRoomName);
	    	if (path.length <= 3) {
				console.log('New claim operation added: ' + closestRoomName + ' -> ' + roomName);
				possibleOperationsMemory[roomName] = {
					ownerRoom: closestRoomName,
					targetRoom: roomName,
					controllerId: report.controllerId,
					distance: path.length
				};		
	    	}
    	}
    }    
}

function activateOperation() {
	var possibleOperations = getPossibleOperationsMemory();
	var activeOperations = getActiveOperationsMemory();
	for (var roomName in possibleOperations) {
		var noOfActiveOps = Object.keys(activeOperations).length;
		var noOfActiveRooms = Object.keys(Memory.myActiveRooms).length
		if ((noOfActiveOps + noOfActiveRooms) < Game.gcl.level) {
			var spec = possibleOperations[roomName];
			if (!hasActiveOperation(spec.ownerRoom)) {
				activeOperations[roomName] = ClaimOperation.create(possibleOperations[roomName]);
				delete possibleOperations[roomName];		
			}
		}
	}
}

function removeCompleetedOperations() {
	var activeOperations = getActiveOperationsMemory();
	for (var roomName in activeOperations) {
		if (ClaimOperation.isCompleted(activeOperations[roomName])) {
			delete activeOperations[roomName];	
		}
	}
}

function hasActiveOperation(ownerRoomName) {
	var activeOperations = getActiveOperationsMemory();	
	for (var roomName in activeOperations) {
		if (activeOperations[roomName].ownerRoom == ownerRoomName) {
			return true;
		}
	}
	return false;
}

function isNewClaimTarget(roomName, report) {
	var possibleOperationsMemory = getPossibleOperationsMemory();
	var activeOperations = getActiveOperationsMemory();	
	return (
		possibleOperationsMemory[roomName] === undefined &&
		activeOperations[roomName] === undefined &&
		Memory.myActiveRooms[roomName] === undefined &&		
		report.type == Static.EXPLORE_TYPE_CONTROLLER_SOURCE &&
		report.sources.length >= 2 &&
		report.exporeState != Static.EXPLORE_ENEMY_CONTROL &&
		report.exporeState != Static.EXPLORE_ENEMY_OPERATION
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