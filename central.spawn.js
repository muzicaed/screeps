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

var SpawnCentral = {
    
    run: function(room) {
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
    } else if (ControllerBase.hasPumpNeed(room)) {
        Pump.create(room);
        return true;
    } else if (IS_INVATION) {
        Defender.create(room);
        return true;
    }
    return false;
}

function handleCity(room) {
    if (Finder.countRole(room, Static.ROLE_HARVESTER) == 0 && Finder.countRole(room, Static.ROLE_TRANSPORTER) == 0 && Finder.countRole(room, Static.ROLE_PIONEER) < 2) {
        Pioneer.panicCreate(room);    
        return true;
    } else if (ResourceCentral.needTransporter(room)) {
        Transporter.create(room, Static.ROLE_TRANSPORTER);
        return true;
    } else if (ResourceCentral.needHarvester(room)) {
        Harvester.create(room, {}); 
        return true;
    } else if (Finder.countRole(room, Static.ROLE_SPAWNKEEPER) < 1) {
        SpawnKeeper.create(room);        
        return true;
    } else if (ControllerBase.hasPumpNeed(room)) {
        Pump.create(room);
        return true;
    } else if (hasCaretakerNeed(room, 2)) {
        Caretaker.create(room);
        return true;
    } else if (Game.time > (room.memory.lastScount + 5000)) {
        room.memory.lastScount = Game.time;
        Scout.create(room);
        return true;
    }

    return false;
}

function handleCivilization(room) {
    if (Finder.countRole(room, Static.ROLE_HARVESTER) == 0 && Finder.countRole(room, Static.ROLE_TRANSPORTER) == 0 && Finder.countRole(room, Static.ROLE_PIONEER) < 2) {
        Pioneer.panicCreate(room);  
        return true;    
    } else if (ResourceCentral.needTransporter(room)) {
        Transporter.create(room, Static.ROLE_CIV_TRANSPORTER);     
        return true;
    } else if (ResourceCentral.needHarvester(room)) {
        Harvester.create(room, {}); 
        return true;
    } else if (Finder.countRole(room, Static.ROLE_SPAWNKEEPER) < 1) {
        SpawnKeeper.create(room);
        return true;
    } else if (ControllerBase.hasPumpNeed(room)) {
        Pump.create(room);
        return true;
    } else if (hasCaretakerNeed(room, 1)) {
        Caretaker.create(room);
        return true;
    } else if (IS_INVATION) {
        Defender.create(room);
        return true;
    } else if (Game.time > (room.memory.lastScount + 2000)) {
        room.memory.lastScount = Game.time;
        Scout.create(room);
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
    return (
        (ConstructionCentral.getCurrentOrder(room) !== null || RepairCentral.hasRepairNeed(room)) &&
        Finder.countRole(room, Static.ROLE_CARETAKER) < max
    );
}

module.exports = SpawnCentral;