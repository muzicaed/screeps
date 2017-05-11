var Society = require('central.society');

var OperationHelper = {
    closestRoom: function (targetRoomName, socLevel) {
        var closestDistance = 100000;
        var closestRoomName = null;
        for (var roomName in Memory.myActiveRooms) {
            var room = Game.rooms[roomName];
            var linDist = Game.map.getRoomLinearDistance(roomName, targetRoomName);
            if (linDist <= 3) {
                var distance = Game.map.findRoute(roomName, targetRoomName).length;
                if (distance < closestDistance && Society.getLevel(room) >= socLevel) {
                    closestDistance = distance;
                    closestRoomName = roomName;
                }
            }
        }
        return closestRoomName;
    }      
};

module.exports = OperationHelper;