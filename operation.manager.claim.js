var Static = require('system.static');
var ClaimOperation = require('operation.claim');
var OperationHelper = require('operation.helper');

var ClaimOperationManager = {

	processReports: function(reports) {		
		for (var id in reports) {
			processReport(id, reports[id]);
		}
		activateOperation();
		removeCompleetedOperations();
		if (Game.time % 10 == 0) {
			clearPossibleOperations();
		}
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
    	var closestRoomName = OperationHelper.closestRoom(roomName, Static.SOCIETY_LEVEL_SUPER_POWER);
    	if (closestRoomName !== null) {
	    	var path = Game.map.findRoute(roomName, closestRoomName);
	    	if (isValidRoomPath(path) && (path.length == 2 || path.length == 3)) {
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

function isValidRoomPath(path) {
    var reports = getScoutReportsMemory();
    for (var i = 0; i < path.length; i++) {
        var report = reports[path[i].room];
        if (report === undefined || report.enemyReport.enemyCreeps === undefined || report.enemyReport.enemyCreeps > 0) {
            console.log(path[i].room + ' not valid path for claim operation.');
            return false;
        }
    }
    
    return true;
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
				console.log('Active claim operation: ' + spec.ownerRoom + ' -> ' + roomName);
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

function clearPossibleOperations() {
	Memory.operations.possibleOperations.claim = {};
}

function getPossibleOperationsMemory() {
    return Memory.operations.possibleOperations.claim;    
}

function getActiveOperationsMemory() {
    return Memory.operations.activeOperations.claim;    
}

function getScoutReportsMemory() {
    return Memory.scoutReports;    
}


module.exports = ClaimOperationManager;