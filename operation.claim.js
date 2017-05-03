
var ClaimOperation = {

	processReports: function(reports) {		
		for (var id in reports) {
			processReport(id, reports[id]);
		}		
	},

	run: function() {
		var activeOperations = getActiveOperationsMemory();
		for (var id in activeOperations) {
			runOperation(id, activeOperations[id]);
		}
	}
};

function processReport(id, report) {
    // TODO: process
}

function runOperation(id, operation) {
    // TODO: Run
}

function getPossibleOperationsMemory() {
    return Memory.operations.possibleOperations.claim;    
}

function getActiveOperationsMemory() {
    return Memory.operations.activeOperations.claim;    
}


module.exports = ClaimOperation;