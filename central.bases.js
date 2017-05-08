var MEMORY = 'CentralBases';
var BaseHQ = require('base.hq');
var ControllerBase = require('base.controller');
var ExtensionBase = require('base.extension');
var Society = require('central.society');

var BasesCentral = {

    init: function(room) {
        if (room.memory.SYS[MEMORY] === undefined || room.memory.SYS[MEMORY] === null) {
            room.memory.SYS[MEMORY] = {
                extensionBases: [],
                age: 0
            };        
        }     
        BaseHQ.init(room);
        ControllerBase.init(room);    
    },

	run: function(room) {
        BasesCentral.init(room);
        var memory = getMemory(room);
        if (memory.age > 70) {
            console.log('BasesCentral.run()');
            memory.age = 0;
            BaseHQ.run(room);
            ControllerBase.run(room);
            handleExtentionBase(room);
        }
        memory.age++;          
	}
};

function handleExtentionBase(room) {
    var memory = getMemory(room);
    var ctrlLevel = room.controller.level;
    if (Society.getLevel(room) >= 2) {
        for (var i = 0; i < extentionBasePerCtrlLevel[ctrlLevel]; i++) {
            var basePos = memory.extensionBases[i];
            if (basePos === undefined || basePos === null) {
                var placementPos = ExtensionBase.init(room, i);
                memory.extensionBases.push(placementPos);
                return;
            } else {
                ExtensionBase.run(room, i);    
            }                
        }
    }
}

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}

var extentionBasePerCtrlLevel = {
    1: 0, 2: 0, 3: 1, 4: 3,
    5: 5, 6: 7, 7: 9, 8: 11
}

module.exports = BasesCentral;