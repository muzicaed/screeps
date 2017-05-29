
var MEMORY = "CentralSociety";
var Finder = require('system.finder');
var BaseHQ = require('base.hq');
var ControllerBase = require('base.controller');
var ResourceCentral = require('central.resources');
var Static = require('system.static');

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
        Society.init(room);
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
        if (memory !== undefined) {
            return memory.current.level;
        }
        return 0;
    },
    
    isSettlement: function(room) {
        var memory = getMemory(room);
        return (memory.current.level == Static.SOCIETY_LEVEL_OUTPOST);
    },
    
    isCity: function(room) {
        var memory = getMemory(room);
        return (memory.current.level == Static.SOCIETY_LEVEL_CITY);
    },
    
    isCivilization: function(room) {
        var memory = getMemory(room);
        return (memory.current.level == SOCIETY_LEVEL_CIVILIZATION);
    },
    
    isSuperPower: function(room) {
        var memory = getMemory(room);
        return (memory.current.level == SOCIETY_LEVEL_SUPER_POWER);
    }     
};

function calculateCurrentSociety(room) {
    var currentSociety = { 
        storage: (room.storage !== null ? 1 : 0), 
        baseContainers: BaseHQ.getAllBaseContainers(room).length,
        sourceContainer: scanSourceContainer(room),
        towers: (Memory.towerManager[room.name] !== undefined ? Memory.towerManager[room.name].towers.length : 0),
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
    1: { storage: 0, baseContainers: 0, sourceContainer: 0, controllerContainer: 0, spawnEnergy: 100, towers: 0 },
    2: { storage: 0, baseContainers: 1, sourceContainer: 1, controllerContainer: 0, spawnEnergy: 500, towers: 0 },
    3: { storage: 1, baseContainers: 2, sourceContainer: 1, controllerContainer: 1, spawnEnergy: 1750, towers: 1 },
    4: { storage: 1, baseContainers: 2, sourceContainer: 1, controllerContainer: 1, spawnEnergy: 2300, towers: 2 }
};

module.exports = Society;