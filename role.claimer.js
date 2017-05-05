var Static = require('system.static');
var CreepFactory = require('factory.creep');
var MoveBehaviour = require('behaviour.move');

var RoleClaimer = {

    run: function(creep) {
        if (creep.room.name != creep.memory.targetRoomName) {
            MoveBehaviour.movePath(creep, new RoomPosition(25, 25, creep.memory.targetRoomName));  
        } else {
            doClaim(creep);    
        }        
    },
    
    create: function(room, targetRoomName) {
        var newCreep = CreepFactory.create(room, Static.ROLE_CLAIMER, 'CLAIM');
        if (newCreep !== null) {
            MoveBehaviour.setup(newCreep);
            newCreep.memory.targetRoomName = targetRoomName;
            return newCreep.name;
        }        
        return null;
    }
};

function doClaim(creep) {
    var target = creep.room.controller;
    if (target !== null) {
        var res = creep.claimController(target);
        if (res == ERR_NOT_IN_RANGE) {
            MoveBehaviour.movePath(creep, target);
        } 
    }
}

module.exports = RoleClaimer;