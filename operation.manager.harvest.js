var Static = require('system.static');
var HarvestOperation = require('operation.harvest');
var OperationHelper = require('operation.helper');

var HarvestOperationManager = {

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
			HarvestOperation.run(activeOperations[roomName]);
		}
	}	
};

function processReport(roomName, report) {
    var possibleOperationsMemory = getPossibleOperationsMemory();
    if (isNewHarvestTarget(roomName, report)) {
		var closestRoomName = OperationHelper.closestRoom(roomName, Static.SOCIETY_LEVEL_CIVILIZATION);
    	if (closestRoomName !== null) {
	    	var path = Game.map.findRoute(roomName, closestRoomName);
	    	if (path.length <= 1) {
				console.log('New harvest operation added: ' + closestRoomName + ' -> ' + roomName);
				possibleOperationsMemory[roomName] = {
					ownerRoom: closestRoomName,
					targetRoom: roomName,
					controllerId: report.controllerId,
					sourceId: report.sources[0],
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
		var spec = possibleOperations[roomName];
		if (!hasActiveStartup(spec.ownerRoom)) {
			activeOperations[roomName] = HarvestOperation.create(possibleOperations[roomName]);
			delete possibleOperations[roomName];			
		}
	}
}

function hasActiveStartup(ownerRoomName) {
	var activeOperations = getActiveOperationsMemory();	
	for (var roomName in activeOperations) {
		var activeOp = activeOperations[roomName];
		if (activeOp.ownerRoom == ownerRoomName && HarvestOperation.isStartup(activeOp)) {
			return true;
		}
	}
	return false;
}

function removeCompleetedOperations() {
	var activeOperations = getActiveOperationsMemory();
	for (var roomName in activeOperations) {
		if (HarvestOperation.isCompleted(activeOperations[roomName])) {
			delete activeOperations[roomName];	
		}
	}
}

function isNewHarvestTarget(roomName, report) {
	var possibleOperationsMemory = getPossibleOperationsMemory();
	var activeOperations = getActiveOperationsMemory();	
	return (
		possibleOperationsMemory[roomName] === undefined &&
		activeOperations[roomName] === undefined &&
		Memory.myActiveRooms[roomName] === undefined &&		
		(report.type == Static.EXPLORE_TYPE_SOURCE_ONLY || report.type == Static.EXPLORE_TYPE_CONTROLLER_SOURCE) &&
		report.sources.length == 1 &&
		report.exporeState != Static.EXPLORE_ENEMY_CONTROL &&
		report.exporeState != Static.EXPLORE_ENEMY_OPERATION
	);
}

function getPossibleOperationsMemory() {
    return Memory.operations.possibleOperations.harvest;    
}

function getActiveOperationsMemory() {
    return Memory.operations.activeOperations.harvest;    
}


module.exports = HarvestOperationManager;