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

var IS_INVATION = false;


// Refactorig and rebuild this...
var SpawnCentral = {
    
    init: function(room) {
        
    },

    run: function(room) {
        
        if (!handleEnemies(room)) {                            
            if(Game.time % 10 == 0) {
                switch (Society.getLevel(room)) {                
                    case Static.SOCIETY_LEVEL_OUTPOST:
                        handleOutpost(room);
                        break;

                    case Static.SOCIETY_LEVEL_CITY:
                        handleCity(room);
                        break;

                    case Static.SOCIETY_LEVEL_CIVILIZATION:
                        handleCizilization(room);
                        break;                                
                }
            }
        }
    }             
};

function handleOutpost(room) {
    
    if (room.name == 'sim' && Finder.countRole(room, Static.ROLE_SIMCREEP) < 1) {
        SimCreep.create(room);     
        return;
    }    
    
    if (Finder.countRole(room, Static.ROLE_PIONEER) == 0) {
        Pioneer.panicCreate(room);
    } else if (ResourceCentral.needPioneer(room)) {
        Pioneer.create(room);
    } else if (Finder.countRole(room, Static.ROLE_CARETAKER) < 1) {
        Caretaker.create(room);
    } else if (ControllerBase.hasPumpNeed(room)) {
        Pump.create(room);
    } else if (IS_INVATION) {
        Defender.create(room);
    }
}

function handleCity(room) {
    if (Finder.countRole(room, Static.ROLE_HARVESTER) == 0 && Finder.countRole(room, Static.ROLE_TRANSPORTER) == 0 && Finder.countRole(room, Static.ROLE_PIONEER) < 2) {
        Pioneer.panicCreate(room);    
    } else if ((Finder.countRole(room, Static.ROLE_TRANSPORTER) < (Finder.countRole(room, Static.ROLE_HARVESTER) * 2))) {
        Transporter.create(room, Static.ROLE_TRANSPORTER);    
    } else if (ResourceCentral.needHarvester(room)) {
        Harvester.create(room, {}); 
    } else if (Finder.countRole(room, Static.ROLE_SPAWNKEEPER) < 1) {
        SpawnKeeper.create(room);        
    } else if (ControllerBase.hasPumpNeed(room)) {
        Pump.create(room);
    } else if (hasCaretakerNeed(room, 1)) {
        Caretaker.create(room);
    } else if (Game.time < (room.memory.lastScount + 2000)) {
        room.memory.lastScount = Game.time;
        Scout.create(room);
    }
}

function handleCizilization(room) {
    if ((Finder.countRole(room, Static.ROLE_CIV_TRANSPORTER) < (Finder.countRole(room, Static.ROLE_HARVESTER) * 1.5))) {
        Transporter.create(room, Static.ROLE_CIV_TRANSPORTER);     
    } else if (ResourceCentral.needHarvester(room)) {
        Harvester.create(room, {}); 
    } else if (Finder.countRole(room, Static.ROLE_SPAWNKEEPER) < 1) {
        SpawnKeeper.create(room);
    } else if (ControllerBase.hasPumpNeed(room)) {
        Pump.create(room);
    } else if (hasCaretakerNeed(room, 2)) {
        Caretaker.create(room);
    } else if (IS_INVATION) {
        Defender.create(room);
    } else if (Game.time < (room.memory.lastScount + 500)) {
        room.memory.lastScount = Game.time;
        Scout.create(room);
    }
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
    return (
        (ConstructionCentral.getCurrentOrder(room) !== null || RepairCentral.hasRepairNeed(room)) &&
        Finder.countRole(room, Static.ROLE_CARETAKER) < max
    );
}

module.exports = SpawnCentral;