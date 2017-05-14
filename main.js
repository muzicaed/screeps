//var profiler = require('screeps-profiler');
var Pioneer = require('role.pioneer');
var Harvester = require('role.harvester');
var Transporter = require('role.transporter');
var Caretaker = require('role.caretaker');
var SpawnKeeper = require('role.spawnkeeper');
var Defender = require('role.defender');
var Scout = require('role.scout');
var SimCreep = require('role.simcreep');
var Pump = require('role.pump');
var Claimer = require('role.claimer');
var Colonizer = require('role.colonizer');
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
var Utils = require('system.utils');

//profiler.enable();
module.exports.loop = function () {    
  //  profiler.wrap(function() {        
        // Disable log
        //console.log = function() {}; 
        Game.flags = {};
        garbageCollect();        
        runRooms();
        runCreeps();     
        OperationManager.run();
   // });
};

function runRooms() {   
    for (var i in Game.rooms) {
        var room = Game.rooms[i];
        if (room.controller !== undefined) {
           if (!room.memory.isInitialized) {  
                room.memory.SYS = {}; 
                room.memory.isInitialized = true;
                room.memory.lastScount = 0;
            }           

            ConstructionCentral.run(room);
            RoadsCentral.run(room);
            RepairCentral.run(room);

            if (room.controller.level > 0 && room.controller.my && room.firstSpawn() !== null) {  
                Bases.run(room);
                Society.run(room);                
                ResourceCentral.run(room);
                room.memory.SYS.didSpawn = SpawnCentral.run(room);                                    
                
                runTowers(room);
                handleActiveRoom(room);
                // TODO: Make this a lot better...
                if (room.controller && room.controller.safeModeAvailable > 0) {
                    room.controller.activateSafeMode();
                }         
            }
        }     
    }
}

function runCreeps() {
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        roleObjectMap[creep.memory.role].run(creep);
    }     
}

// TODO: Refactoring - Tower manager
function runTowers(room) {
    if (Memory.towerManager === undefined) {
        Memory.towerManager = {};
    }

   if (Memory.towerManager[room.name] === undefined) {
        Memory.towerManager[room.name] = {
            count: 0,
            towers: []
        };
    }

    var memory = Memory.towerManager[room.name];
    if (memory.count > 10) {
        memory.count = 0;
        var towers = Finder.findAllStructures(room, STRUCTURE_TOWER, true);
        memory.towers = Utils.createIdArray(towers);
    }

    for (i = 0; i < memory.towers.length; i++) {
        var tower = Game.getObjectById(memory.towers[i]);
        TowerStandard.run(tower);
    }
    memory.count++;
}

function handleActiveRoom(room) {
    if (Memory.myActiveRooms === undefined) {
        Memory.myActiveRooms = {};
    }
    Memory.myActiveRooms[room.name] = room.name;    
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
roleObjectMap[Static.ROLE_CLAIMER] = Claimer;
roleObjectMap[Static.ROLE_RESERVER] = Claimer;
roleObjectMap[Static.ROLE_COLONIZER] = Colonizer;
