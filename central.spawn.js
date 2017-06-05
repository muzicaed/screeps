var MEMORY = 'CentralSpawn';
var Pioneer = require('role.pioneer');
var Harvester = require('role.harvester');
var Transporter = require('role.transporter');
var Caretaker = require('role.caretaker');
var SpawnKeeper = require('role.spawnkeeper');
var Defender = require('role.defender');
var Scout = require('role.scout');
var SimCreep = require('role.simcreep');
var Pump = require('role.pump');
var Society = require('central.society');
var ResourceCentral = require('central.resources');
var ConstructionCentral = require('central.construction');
var RepairCentral = require('central.repair');
var ControllerBase = require('base.controller');
var Static = require('system.static');
var Finder = require('system.finder');

var IS_INVASION = false;

var SpawnCentral = {
    
    init: function(room) {
        if (room.memory.SYS[MEMORY] === undefined) {            
            room.memory.SYS[MEMORY] = {
                lastScout: 0,                
                transporterCooldown: 0,
                pumpCooldown: 0
            };
        }
    },

    run: function(room) {
        SpawnCentral.init(room);
        if (!handleEnemies(room)) { 
            if (Game.time % 10 == 0) {              
                switch (Society.getLevel(room)) {                
                    case Static.SOCIETY_LEVEL_OUTPOST:
                        return handleOutpost(room);
                        break;

                    case Static.SOCIETY_LEVEL_CITY:
                        return handleCity(room);
                        break;

                    case Static.SOCIETY_LEVEL_CIVILIZATION:
                    case Static.SOCIETY_LEVEL_SUPER_POWER:
                        return handleCivilization(room);
                        break;                                
                }
            }
        }

        return true;
    }             
};

function handleOutpost(room) {
    
    if (room.name == 'sim' && Finder.countRole(room, Static.ROLE_SIMCREEP) < 1) {
        SimCreep.create(room);     
        return true;
    }    
    
    if (Finder.countRole(room, Static.ROLE_PIONEER) == 0) {
        Pioneer.panicCreate(room);
        return true;
    } else if (ResourceCentral.needPioneer(room)) {
        Pioneer.create(room);
        return true;
    } else if (hasCaretakerNeed(room, 1)) {
        Caretaker.create(room);
        return true;
    } else if (hasPumpNeed(room)) {
        if (Pump.create(room) !== null) {
            memory.pumpCooldown = 20;
        }             
        return true;
    } else if (IS_INVASION) {
        console.log('Spawn defender!');
        Defender.create(room);
        return true;
    }
    return false;
}

function handleCity(room) {
    var memory = getMemory(room);  
    if (Finder.countRole(room, Static.ROLE_HARVESTER) == 0 && Finder.countRole(room, Static.ROLE_TRANSPORTER) == 0 && Finder.countRole(room, Static.ROLE_PIONEER) < 3) {
        Pioneer.panicCreate(room);    
        return true;
    } else if (hasTransporterNeed(room)) {
        var containerId = ResourceCentral.requestTransportAssignment(room);
        if (Transporter.create(room, Static.ROLE_CIV_TRANSPORTER, containerId) !== null) {
            memory.transporterCooldown = 15;
        }     
        return true;
    } else if (ResourceCentral.needHarvester(room)) {
        Harvester.create(room, {}); 
        return true;
    } else if (hasSpawnKeeperNeed(room)) {
        SpawnKeeper.create(room);        
        return true;
    } else if (hasPumpNeed(room)) {
        if (Pump.create(room) !== null) {
            memory.pumpCooldown = 20;
        }             
        return true;
    } else if (hasCaretakerNeed(room, 1)) {
        Caretaker.create(room);
        return true;
    } else if (Game.time > (memory.lastScout + 2000)) {
        if (Scout.create(room)) {
            memory.lastScout = Game.time;        
        }
        return true;
    }

    return false;
}

function handleCivilization(room) {
    var memory = getMemory(room);  
    if (Finder.countRole(room, Static.ROLE_HARVESTER) == 0 && Finder.countRole(room, Static.ROLE_TRANSPORTER) == 0) {
        SpawnKeeper.panicCreate(room);  
        return true;    
    } else if (hasTransporterNeed(room)) {
        var containerId = ResourceCentral.requestTransportAssignment(room);
        if (Transporter.create(room, Static.ROLE_CIV_TRANSPORTER, containerId) !== null) {
            memory.transporterCooldown = 15;
        }     
        return true;
    } else if (ResourceCentral.needHarvester(room)) {
        Harvester.create(room, {}); 
        return true;
    } else if (hasSpawnKeeperNeed(room)) {
        SpawnKeeper.create(room);
        return true;
    } else if (hasPumpNeed(room)) {
        if (Pump.create(room) !== null) {
            memory.pumpCooldown = 20;
        }             
        return true;
    } else if (hasCaretakerNeed(room, 1)) {
        Caretaker.create(room);
        return true;
    } else if (IS_INVASION) {
        Defender.create(room);
        return true;
    } else if (Game.time > (memory.lastScout + 500)) {            
        if (Scout.create(room)) {
            memory.lastScout = Game.time;        
        }
        return true;
    }

    return false;
}

function handleEnemies(room) {
    var enemies = room.find(FIND_HOSTILE_CREEPS);
    if (enemies.length > 1) {
        Defender.create(room);
        return true;
    }

    return false;

}

function hasCaretakerNeed(room, max) {
    if (Society.getLevel(room) < 3) {
        return (
            (ConstructionCentral.getCurrentOrder(room) !== null || RepairCentral.hasRepairNeed(room)) &&
            Finder.countRole(room, Static.ROLE_CARETAKER) < max
        );
    }
    
    return (ConstructionCentral.getCurrentOrder(room) !== null && Finder.countRole(room, Static.ROLE_CARETAKER) < max)
}

function hasSpawnKeeperNeed(room) {    
    return (Finder.countRole(room, Static.ROLE_SPAWNKEEPER) < 1);
}

function hasTransporterNeed(room) {
    var memory = getMemory(room);
    if (ResourceCentral.needTransporter(room) && memory.transporterCooldown <= 0) {        
        return true;
    }    
    memory.transporterCooldown--;
    return false;   
}

function hasPumpNeed(room) {
    var memory = getMemory(room);
    if (ControllerBase.hasPumpNeed(room) && memory.pumpCooldown <= 0) {        
        return true;
    }
    memory.pumpCooldown--;
    return false;   
}

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}

module.exports = SpawnCentral;