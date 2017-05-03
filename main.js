var profiler = require('screeps-profiler');
var Pioneer = require('role.pioneer');
var Harvester = require('role.harvester');
var Transporter = require('role.transporter');
var Caretaker = require('role.caretaker');
var SpawnKeeper = require('role.spawnkeeper');
var Defender = require('role.defender');
var Scout = require('role.scout');
var SimCreep = require('role.simcreep');
var Pump = require('role.pump');
var TowerStandard = require('tower.standard');
var ResourceCentral = require('central.resources');
var RoadsCentral = require('central.roads');
var SpawnCentral = require('central.spawn');
var BasesCentral = require('central.bases');
var CreepFactory = require('factory.creep');
var ConstructionCentral = require('central.construction');
var RepairCentral = require('central.repair');
var Society = require('central.society');
var Bases = require('central.bases');
var Static = require('system.static');
var Finder = require('system.finder');
var BaseFactory = require('factory.base');
var OperationManager = require('operation.manager');

profiler.enable();
module.exports.loop = function () {    
    profiler.wrap(function() {
        // Main.js logic should go here.
        
        // Disable log
        //console.log = function() {};    
        garbageCollect();        
        runRooms();
        runCreeps();     
        OperationManager.run();   
    });
};

function runRooms() {   
    Memory.myActiveRooms = {};
    for (var i in Game.rooms) {
        var room = Game.rooms[i];
        if (room.controller !== undefined && room.controller.my) {
            if (!room.memory.isInitialized) {  
                console.log('Init');
                room.memory.SYS = {};          
                Society.init(room);
                ConstructionCentral.init(room);
                RepairCentral.init(room);
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
            RepairCentral.run(room);
            
            runTowers(room);
            Memory.myActiveRooms[room.name] = room.name;
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
        roleObjectMap[creep.memory.role].run(creep);
    }     
}

function runTowers(room) {
    var towers = Finder.findAllStructures(room, STRUCTURE_TOWER, true);
    for (i = 0; i < towers.length; i++) {
        TowerStandard.run(towers[i]);
    }
}

function garbageCollect() {
    for(var i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    } 
}

Room.prototype.firstSpawn = function() {
    var spawns = this.find(FIND_MY_SPAWNS);
    if (spawns.length > 0) {
        return spawns[0];
    }
    return null;
};

var roleObjectMap = {};
roleObjectMap[Static.ROLE_PIONEER] = Pioneer;
roleObjectMap[Static.ROLE_TRANSPORTER] = Transporter;
roleObjectMap[Static.ROLE_CIV_TRANSPORTER] = Transporter;
roleObjectMap[Static.ROLE_CARETAKER] = Caretaker;
roleObjectMap[Static.ROLE_HARVESTER] = Harvester;
roleObjectMap[Static.ROLE_SPAWNKEEPER] = SpawnKeeper;
roleObjectMap[Static.ROLE_PUMP] = Pump;
roleObjectMap[Static.ROLE_DEFENDER] = Defender;
roleObjectMap[Static.ROLE_SCOUT] = Scout;
roleObjectMap[Static.ROLE_SIMCREEP] = SimCreep;
