var MEMORY = 'CentralBases';
var BaseHQ = require('base.hq');
var ControllerBase = require('base.controller');
var ExtensionBase = require('base.extension');

var BasesCentral = {

    init: function(room) {
        BaseHQ.init(room);
        ControllerBase.init(room);

        // TODO: Not needed to store this.    
        if (room.memory.SYS[MEMORY] === undefined) { // TODO: REMOVE TEST TRUE
            room.memory.SYS[MEMORY] = {
                extensionBases: [],
                age: 0
            };
        }
    },

	run: function(room) {
        var memory = getMemory(room);
        var ctrlLevel = room.controller.level;
       if (memory.age > 70) {
           console.log('Run: BasesCentral');
            memory.age = 0;
            BaseHQ.run(room);
            ControllerBase.run(room);
            for (var i = 0; i < extentionBasePerCtrlLevel[ctrlLevel]; i++) {
                var basePos = memory.extensionBases[i];
                if (basePos === undefined || basePos === null) {
                    var placementPos = ExtensionBase.init(room, i);
                    memory.extensionBases.push(placementPos);
                } else {
                    ExtensionBase.run(room, i);    
                }                
            }
        }
        memory.age++;           
	},

    getStats: function(room) {
        return {
            hq: BaseHQ.getStats(room),
            controllerBase: ControllerBase.getStats(room),
            extensionBases: ExtensionBase.getStats(room)         
        };
    }
};

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}

var extentionBasePerCtrlLevel = {
    1: 0, 2: 0, 3: 1, 4: 3,
    5: 5, 6: 7, 7: 9, 8: 11
}

module.exports = BasesCentral;