var RepairCentral = require('central.repair');
var Society = require('central.society');

var TowerStandard = {
    
    run: function(tower) {
        var creep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var repairTarget = RepairCentral.secondInQueue(tower.room);
        if (Society.getLevel(tower.room) >= 3) {
            repairTarget = RepairCentral.nextInQueue(tower.room);
        }
        if (tower.pos.getRangeTo(creep) < 25) {
            tower.attack(creep);
        } else if (repairTarget !== null) {
            tower.repair(repairTarget);
        }
    }
};

module.exports = TowerStandard;