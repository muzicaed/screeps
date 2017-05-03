
var TowerStandard = {
    
    run: function(tower) {
        var creep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (tower.pos.getRangeTo(creep) < 15) {
            tower.attack(creep);
        }
    }
};

module.exports = TowerStandard;