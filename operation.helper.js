var Society = require('central.society');

var OperationHelper = {
    closestRoom: function (targetRoomName, socLevel) {
        var closestDistance = 100000;
        var closestRoomName = null;
        for (var roomName in Memory.myActiveRooms) {
            var room = Game.rooms[roomName];
            var distance = Game.map.getRoomLinearDistance(roomName, targetRoomName);
            if (distance < closestDistance && Society.getLevel(room) >= socLevel) {
                closestDistance = distance;
                closestRoomName = roomName;
            }
        }
        return closestRoomName;
    }      
};

module.exports = OperationHelper;