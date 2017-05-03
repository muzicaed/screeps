
var OperationManager = {
    init: function() {
        if (Memory.operations === undefined || Memory.operations === null) {
            Memory.operations = {
                possibleOperations: {
                    claim: [],
                    harvest: [],
                    mine: [],
                    aid: []
                },
                activeOperations: {
                    claim: [],
                    harvest: [],
                    mine: [],
                    aid: []
                },
                count: 0
            };
        }
    },  

    run: function() {
        OperationManager.init();
        var memory = getMemory();        
        if (memory.count > 100) {
            memory.count = 0;
            analyzeOperations();
        }
        runActiveOperations();
        memory.count++;        
    }      
};

function runActiveOperations() {
    var memory = getMemory();
    runOperation(memory.activeOperations.claim);
    runOperation(memory.activeOperations.harvest);
    runOperation(memory.activeOperations.mine);
    runOperation(memory.activeOperations.aid);
}

function runOperation(operations) {
    for (var i = 0; i < operations.length; i++) {
        operations[i].run();
    }
}

function analyzeOperations() {
    findNewOperations();
    activateOperations();
}

function findNewOperations() {
    // Run findNewOperations on all operation managers
}

function activateOperations() {
    // Run activateOperations on all operation managers
}

function getMemory() {
    return Memory.operations;    
}

module.exports = OperationManager;