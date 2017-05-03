var Pioneer = require('role.pioneer');
var Harvester = require('role.harvester');
var Builder = require('role.builder');
var Transporter = require('role.transporter');
var Caretaker = require('role.caretaker');
var SpawnKeeper = require('role.spawnkeeper');
var SimCreep = require('role.simcreep');
var Pump = require('role.pump');
var Society = require('central.society');
var ResourceCentral = require('central.resources');
var ControllerBase = require('base.controller');
var Static = require('system.static');
var Finder = require('system.finder');


// Refactorig and rebuild this...
var SpawnCentral = {
    
    init: function(room) {
        
    },

    run: function(room) {
        
        if (room.name == 'sim' && Finder.countRole(room, Static.ROLE_SIMCREEP) < 1 && room.controller.level < 3) {
            room.firstSpawn().createCreep( [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], null, { role: Static.ROLE_SIMCREEP } );     
            return;
        }
        
        if ((Finder.countRole(room, Static.ROLE_TRANSPORTER) < (Finder.countRole(room, Static.ROLE_HARVESTER) * 2))) {
            Transporter.create(room);
        } else if (!Society.isSettlement(room) && ResourceCentral.countSources(room) > Finder.countRole(room, Static.ROLE_HARVESTER)) {
            Harvester.create(room, {}); 
        } else if (Society.isSettlement(room) && Math.ceil(ResourceCentral.countTotalPioneerCapacity(room) * 1.4) > Finder.countRole(room, Static.ROLE_PIONEER)) {  
            Pioneer.create(room);  
        } else if (Finder.countRole(room, Static.ROLE_BUILDER) < 1) {
            Builder.create(room);
        } else if (!Society.isSettlement(room) && Finder.countRole(room, Static.ROLE_SPAWNKEEPER) < 1) {
            SpawnKeeper.create(room);            
        } else if (Society.isCity(room) && Finder.countRole(room, Static.ROLE_PUMP) < ControllerBase.pumpNeed(room)) {
            Pump.create(room);
        } else if (Finder.countRole(room, Static.ROLE_CARETAKER) < 1) {
            Caretaker.create(room);
        }
    },

    getStats: function(room) {
        return {};
        /*
        return {
            pioneers: Finder.countRole(room, Static.ROLE_PIONEER),
            harvesters: Finder.countRole(room, Static.ROLE_HARVESTER),
            harvesterJobs: ResourceCentral.countAvailableAssignments(room),
            builders: Finder.countRole(room, Static.ROLE_BUILDER),
            transporters: Finder.countRole(room, Static.ROLE_TRANSPORTER),
            caretakers: Finder.countRole(room, Static.ROLE_CARETAKER),
            spawnkeepers: Finder.countRole(room, Static.ROLE_SPAWNKEEPER),
            pumps: Finder.countRole(room, Static.ROLE_PUMPS),
            spawnEnergy: room.energyAvailable + '/' + room.energyCapacityAvailable,
        };
        */
    }                
};

module.exports = SpawnCentral;