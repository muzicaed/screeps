var MoveBehaviour = require('behaviour.move');

var HarvestBehaviour = {
    
    do: function(creep) {
        var source = Game.getObjectById(creep.memory.assignedToSourceId);
        var container = Game.getObjectById(creep.memory.assignedToContainerId);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, container);
        }    
    }
};


module.exports = HarvestBehaviour;