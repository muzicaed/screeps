var MoveBehaviour = require('behaviour.move');

var UpgradeControllerBehaviour = {
    
    do: function(creep) {
        var controller = creep.room.controller;
        if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, controller);
        }    
    }
};


module.exports = UpgradeControllerBehaviour;