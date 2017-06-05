    var MEMORY = 'ConstructionCentral';

var ConstructionCentral = {
    
    init: function(room) {
        if (room.memory.SYS[MEMORY] === undefined || room.memory.SYS[MEMORY] === null) {
            room.memory.SYS[MEMORY] = {
                constructionQueue: [],
                rclWaitList: [],
                currentRcl: 0,
                currentConstruction: null,
                age: 0
            };
        }
    },

    run: function(room) {
        ConstructionCentral.init(room);
        var memory = getMemory(room);
        unflag(room);
        if (memory.age > 15) { 
            handleRcl(room);    
            if (isConstructionAllowed(room) && checkConstructioSite(room)) {
                buildNextInQueue(room);   
            }
            memory.age = 0;
        }
        memory.age++;  
    },

    hasConstructionOrders(room) {
        var memory = getMemory(room);
        return (memory.currentConstruction !== null);
    },    

    getCurrentOrder(room) {
        var memory = getMemory(room);
        if (memory.currentConstruction !== null) {            
            if (memory.currentConstruction.id === null) {
                var siteRoomPos = room.getPositionAt(memory.currentConstruction.pos.x, memory.currentConstruction.pos.y);
                var sites = siteRoomPos.lookFor(LOOK_CONSTRUCTION_SITES);
                if (sites.length > 0 ) {
                    memory.currentConstruction.id = sites[0].id;
                } else {
                    return null;
                }
            }
            return Game.getObjectById(memory.currentConstruction.id);
        }
        return null;
    },        
    
    order: function(room, type, pos) {
        var memory = getMemory(room);
        if (!isStructure(room, pos, type) && !inQueue(room, pos, type)) {
            var order = createOrder(room, type, pos);
            memory.constructionQueue.push(order);
            memory.constructionQueue.sort( function(a, b) { return a.prio - b.prio } );
            return true;
        }
        return false;
    },

    checkOrder: function(room, pos, type) {
        return inQueue(room, pos, type);
    },

    getAllOrders: function(room) {
        var memory = getMemory(room);
        return memory.constructionQueue.concat(memory.rclWaitList);
    }
};

function createOrder(room, type, pos) {    
    var orderId = createOrderId(type, pos, room.name);
    if (Game.flags[orderId] !== undefined) {
        Game.flags[orderId].remove();
    }

    var color = getFlagColor(type);
    delete Game.flags[orderId];
    return {
        orderId: orderId,
        flag: room.createFlag(pos, orderId, color, color),
        type: type,
        prio: prioList().indexOf(type),
        id: null,
        pos: {
            x: pos.x,
            y: pos.y
        }
    };
}

function createOrderId(type, pos, roomName) {
    return type + '-' + pos.x + '-' + pos.y + '-' + roomName;
}

function getFlagColor(type) {
    switch(type) {
        case STRUCTURE_ROAD:
            return COLOR_RED;
            break;
        case STRUCTURE_WALL:
            return COLOR_BLUE;            
            break;
    }
    return COLOR_GREEN;
}

function checkConstructioSite(room) {
    var memory = getMemory(room);
    if (memory.currentConstruction !== null) {
        if (isConstructionSite(room, memory.currentConstruction.pos)) {            
            return false;
        }        
        memory.currentConstruction = null;
    }    
    return true;
}

function buildNextInQueue(room) {
    var memory = getMemory(room);
    if (memory.constructionQueue.length > 0) {
        memory.currentConstruction = memory.constructionQueue.shift();
        var pos = memory.currentConstruction.pos;
        var res = room.createConstructionSite(room.getPositionAt(pos.x, pos.y), memory.currentConstruction.type);
        if (res == ERR_RCL_NOT_ENOUGH) {
            memory.rclWaitList.push(memory.currentConstruction);
            memory.currentConstruction = null;
        } else if (res == ERR_INVALID_TARGET) {            
            memory.currentConstruction = null;
        }
    }
}

function isConstructionSite(room, pos) {
    if (pos !== undefined && pos !== null) {
        return (room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y).length > 0);
    }
    return false;
}

function isStructure(room, pos, type) {
    var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
    if (structures.length != 0) {        
        return handleBlocking(room, structures[0], type);
    }
    return false;
}

function inQueue(room, pos, type) {
    var memory = getMemory(room);
    var orderId = createOrderId(type, pos, room.name);
    for (var i = 0; i < memory.constructionQueue.length; i++) {
        if (memory.constructionQueue[i].orderId == orderId) {
            return true;
        }
    }
    for (var i = 0; i < memory.rclWaitList.length; i++) {
        if (memory.rclWaitList[i].orderId == orderId) {
            return true;
        }
    }    
    return false;
}

function handleBlocking(room, structure, buildType) {
    if (buildType != STRUCTURE_ROAD && structure.structureType == STRUCTURE_ROAD) {
        console.log('Construction: Bocking road, OK.');
        return false;
    } else if (buildType == STRUCTURE_ROAD && structure.structureType != STRUCTURE_ROAD) {
        console.log('Construction: Structure blocking, build road = OK.');
        return false;
    }
    console.log('Construction of ' + buildType + ': Bocking structure ' + structure.structureType);
    return true;
} 

function unflag(room) {
    var memory = getMemory(room);
    if (memory.currentConstruction !== null) {
        if (isConstructionSite(room, memory.currentConstruction.pos)) {
            var orderId = createOrderId(memory.currentConstruction.type, memory.currentConstruction.pos, room.name);
            var flag = Game.flags[orderId];
            if (flag !== undefined && flag !== null) {
                flag.remove();
            }
        }
    }
}

function handleRcl(room) {
    var memory = getMemory(room);
    if (memory.currentRcl < room.controller.level) {
        memory.currentRcl = room.controller.level;
        memory.constructionQueue = memory.constructionQueue.concat(memory.rclWaitList);
        memory.constructionQueue.sort( function(a, b) { return a.prio - b.prio } );
        memory.rclWaitList = [];
        console.log('New RCL. Merge RCL Wait list.')
    }
}

function isConstructionAllowed(room) {
    if (room.controller !== undefined && room.controller.my) {
        if (room.controller.level > 1) {
            return true;
        }
        return false;
    }
    return true;
}

function getMemory(room) {
    return room.memory.SYS[MEMORY];
}

function prioList() {
    return [
        STRUCTURE_SPAWN,
        STRUCTURE_TOWER,    
        STRUCTURE_EXTENSION,
        STRUCTURE_CONTAINER,
        STRUCTURE_ROAD, 
        STRUCTURE_STORAGE,
        STRUCTURE_WALL,
        STRUCTURE_RAMPART,
        STRUCTURE_NUKER,
        STRUCTURE_TERMINAL,
        STRUCTURE_LAB,
        STRUCTURE_EXTRACTOR,
        STRUCTURE_POWER_SPAWN,
        STRUCTURE_POWER_BANK,
        STRUCTURE_OBSERVER,
        STRUCTURE_LINK,
        STRUCTURE_PORTAL
    ];
}

module.exports = ConstructionCentral;