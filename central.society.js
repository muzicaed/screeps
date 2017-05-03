
var MEMORY = "CentralSociety";
var Finder = require('system.finder');
var BaseHQ = require('base.hq');
var ControllerBase = require('base.controller');
var ResourceCentral = require('central.resources');

var Society = {
    
    init: function(room) {
        if (room.memory.SYS[MEMORY] === undefined || room.memory.SYS[MEMORY] === null) { 
            room.memory.SYS[MEMORY] = {
                current: { level: 1, current: {}},
                age: 0
            };
        }            
    },

    run: function(room) {
        var memory = getMemory(room);
        if (memory.age > 50) {
            memory.age = 0;
            memory.current = calculateCurrentSociety(room);
        }
        memory.age++;
    },
    
    getCurrent: function(room) {
        var memory = getMemory(room);
        return memory.current;
    },

    getLevel: function(room) {
        var memory = getMemory(room);
        return memory.current.level;
    },
    
    isSettlement: function(room) {
        var memory = getMemory(room);
        return (memory.current.level == 1);
    },
    
    isCity: function(room) {
        var memory = getMemory(room);
        return (memory.current.level == 2);
    },
    
    isCivilization: function(room) {
        var memory = getMemory(room);
        return (memory.current.level == 3);
    }        
};

function calculateCurrentSociety(room) {
    var currentSociety = { 
        storage: (room.storage !== null ? 1 : 0), 
        baseContainers: BaseHQ.getAllBaseContainers(room).length,
        sourceContainer: scanSourceContainer(room),
        controllerContainer: (ControllerBase.getControllerContainerId(room) !== null ? 1 : 0),
        spawnEnergy: room.energyCapacityAvailable
    };
    
    for (var level in levels) {
        var reqObj = levels[level];
        if (!isPassRequirements(currentSociety, reqObj)) {
            return { level: (level - 1), current: currentSociety }
        }
    }
    return { level: 3, current: currentSociety };
}

function isPassRequirements(current, req) {
    for (var key in req) {
        if (current[key] < req[key]) {
            return false;
        }
    }
    return true;
}

function scanSourceContainer(room) {
    var sources = ResourceCentral.getAllSources(room);
    for (var i in sources) {
        var source = sources[i];
        if (source.containerId === null) {
            return 0;
        }
    }
    
    return 1;
}

function getMemory(room) { 
    return room.memory.SYS[MEMORY];
}

var levels = {
    1: { storage: 0, baseContainers: 0, sourceContainer: 0, controllerContainer: 0, spawnEnergy: 100 },
    2: { storage: 0, baseContainers: 1, sourceContainer: 1, controllerContainer: 0, spawnEnergy: 500 },
    3: { storage: 1, baseContainers: 2, sourceContainer: 1, controllerContainer: 1, spawnEnergy: 750 }
};

module.exports = Society;