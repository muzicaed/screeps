var RepairCentral = require('central.repair');
var Society = require('central.society');

var TowerStandard = {
    
    run: function(tower) {
        var creep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var repairTarget = RepairCentral.secondInQueue(tower.room);
        
        if (Society.getLevel(tower.room) >= 3) {
            repairTarget = RepairCentral.nextInQueue(tower.room);
        }
        
        if (creep !== null && tower.pos.getRangeTo(creep) < 25) {
            tower.attack(creep);
        } else if (repairTarget !== null) {
            tower.repair(repairTarget);
        }
        
        if (creep !== null && tower.energy == 0 && tower.room.controller && tower.room.controller.safeModeAvailable > 0) {
            tower.room.controller.activateSafeMode();
        }            
    }
};

module.exports = TowerStandard;