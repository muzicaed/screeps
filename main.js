var profiler = require('screeps-profiler');
var Pioneer = require('role.pioneer');
var Harvester = require('role.harvester');
var Builder = require('role.builder');
var Transporter = require('role.transporter');
var Caretaker = require('role.caretaker');
var SpawnKeeper = require('role.spawnkeeper');
var SimCreep = require('role.simcreep');
var Pump = require('role.pump');
var TowerStandard = require('tower.standard');
var ResourceCentral = require('central.resources');
var RoadsCentral = require('central.roads');
var SpawnCentral = require('central.spawn');
var BasesCentral = require('central.bases');
var CreepFactory = require('factory.creep');
var ConstructionCentral = require('central.construction');
var Society = require('central.society');
var Bases = require('central.bases');
var Static = require('system.static');
var Finder = require('system.finder');
var BaseFactory = require('factory.base');

profiler.enable();
module.exports.loop = function () {    
    profiler.wrap(function() {
        // Main.js logic should go here.
        
        // Disable log
        //console.log = function() {};    
        runRooms();
        runCreeps();    
    });
};

function runRooms() {   
        
    for (var i in Game.rooms) {
        var room = Game.rooms[i];

        if (room.controller.my) {
            if (!room.memory.isInitialized) {  
                console.log('Init');
                room.memory.SYS = {}; 
                room.memory.SYS = {};          
                Society.init(room);
                ConstructionCentral.init(room);
                RoadsCentral.init(room);
                Bases.init(room);                
                ResourceCentral.init(room);                
                SpawnCentral.init(room);                
                room.memory.isInitialized = true;
            }       
          
            Bases.run(room);
            Society.run(room);
            RoadsCentral.run(room);
            ResourceCentral.run(room);
            SpawnCentral.run(room);        
            ConstructionCentral.run(room);
            
            runTowers(room);
            refreshStats(room);

            // TODO: Make this a lot better...
            if (room.controller && room.controller.safeModeAvailable > 0) {
                room.controller.activateSafeMode();
            }         
        }      
    }
}

function runCreeps() {
    for (var i in Game.creeps) {
        var creep = Game.creeps[i];
        switch (creep.memory.role) {
            case Static.ROLE_PIONEER:
                Pioneer.run(creep);
                break;            
            case Static.ROLE_HARVESTER:
                Harvester.run(creep);
                break;
            case Static.ROLE_BUILDER:
                Builder.run(creep);
                break;
            case Static.ROLE_TRANSPORTER:
                Transporter.run(creep);
                break;        
            case Static.ROLE_CARETAKER:                
                Caretaker.run(creep);
                break;         
            case Static.ROLE_SPAWNKEEPER:
                SpawnKeeper.run(creep);
                break;   
            case Static.ROLE_PUMP:
                Pump.run(creep);
                break;                   
            case Static.ROLE_SIMCREEP:
                SimCreep.run(creep);
                break;                  
        }
    }      
}

function runTowers(room) {
    var towers = Finder.findAllStructures(room, STRUCTURE_TOWER, true);
    for (i = 0; i < towers.length; i++) {
        TowerStandard.run(towers[i]);
    }
}

function refreshStats(room) {
    room.memory.stats = {
        bases: BasesCentral.getStats(room),
        construction: ConstructionCentral.getStats(room),
        resources: ResourceCentral.getStats(room),
        roads: RoadsCentral.getStats(room),
        society: Society.getStats(room),
        spawn: SpawnCentral.getStats(room)
    };  
}

Room.prototype.firstSpawn = function() {
    var spawns = this.find(FIND_MY_SPAWNS);
    if (spawns.length > 0) {
        return spawns[0];
    }
    return null;
};
