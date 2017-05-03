var Static = require('system.static');
var Society = require('central.society');

var CreepFactory = {
    
    create: function(room, role, initState) {
        var res = room.firstSpawn().createCreep( 
           getParts(room, role, room.energyCapacityAvailable), 
           randomRoleName(role), 
           { role: role, state: initState } 
        );
        
        
        if (_.isString(res)) {
            return Game.creeps[res];
        }           

        return null;
    }
};

function getParts(room, role, energy) {
    var parts = [];
    if (recipies[role] !== undefined) {
        var energyBudget = Math.min(energy, recipies[role].optimalEnergy);
        for(var i = 0; i < recipies[role].protoParts.length; i++) {
            var proto = recipies[role].protoParts[i];
            pushPart(
                proto.type, 
                parts, 
                calculateNoOfParts(parts, energyBudget, proto)
            );
        }
        tryPadding(parts, energyBudget, recipies[role].protoParts);
    }
    return parts;
}


function tryPadding(parts, energyBudget, protoParts) {
    for(var i = 0; i < protoParts.length; i++) {
        var proto = protoParts[i];

        if ((bodyCost[proto.type] + calculateCost(parts)) <= energyBudget) {
            parts.push(proto.type);
            return;
        }
    }
}

function calculateNoOfParts(parts, energyBudget, proto) {
    var noOfParts = 0;
    switch(proto.use) {
        case 'static':            
            noOfParts = proto.no;
            break;

        case 'fill':
            noOfParts = calculateFill(parts, energyBudget, proto);
            break;

        case 'fact':
            noOfParts = calculateFactor(energyBudget, proto);
            break;            

        case 'match':
            noOfParts = calculateMatch(parts, energyBudget, proto);
            break;             
    }

    return noOfParts;
}

function calculateFill(parts, energyBudget, proto) {
    var budget = energyBudget - calculateCost(parts);
    return Math.floor(budget / bodyCost[proto.type]);    
}

function calculateFactor(energyBudget, proto) {
    var res = (energyBudget * proto.factor) / bodyCost[proto.type];
    return Math.floor(res);
}

function calculateMatch(parts, energyBudget, proto) {
    var partsCopy = parts.slice();
    for (var i = 0; i < parts.length; i++) {
        if (i % 3 == 0) {
            parts[i] = proto.type;
        }
    }
    // Add 0 parts.
    return 0;
}

function randomRoleName(role) {
    return role + '-' + Game.time.toString();
}

function pushPart(type, arr, count) {
    for(var i = 0; i < count; i++) {
        arr.push(type);
    }
}

function calculateCost(bodyParts) {
    var cost = 0;
    for (var i = 0; i < bodyParts.length; i++) {
        cost += bodyCost[bodyParts[i]];
    }
    return cost;
}


/**
 * optimalEnergy = Using more engergy is useless, as the role is optimal at this enegy level.
 */
var recipies = {};
recipies[Static.ROLE_HARVESTER] = { 
    optimalEnergy: 550, 
    protoParts: [
        { type: MOVE,  use: 'static', no: 1 },
        { type: WORK,  use: 'fill' }
    ] 
};
recipies[Static.ROLE_TRANSPORTER] = { 
    optimalEnergy: 700, 
    protoParts: [
        { type: CARRY, use: 'fact', factor: 0.50 },
        { type: MOVE,  use: 'fact', factor: 0.50 } 
    ] 
};
recipies[Static.ROLE_PIONEER] = { 
    optimalEnergy: 550, 
    protoParts: [
        { type: WORK,  use: 'fact', factor: 0.75 },
        { type: CARRY, use: 'fact', factor: 0.25 },
        { type: MOVE,  use: 'match' }
    ] 
};
recipies[Static.ROLE_BUILDER] = { 
    optimalEnergy: 5000, 
    protoParts: [
        { type: WORK,  use: 'fact', factor: 0.60 },
        { type: CARRY, use: 'fact', factor: 0.40 },
        { type: MOVE,  use: 'match' }    
    ] 
};
recipies[Static.ROLE_CARETAKER] = { 
    optimalEnergy: 5000, 
    protoParts: [
        { type: WORK,  use: 'fact', factor: 0.50 },
        { type: CARRY, use: 'fact', factor: 0.50 },
        { type: MOVE,  use: 'match' }       
    ] 
};
recipies[Static.ROLE_SPAWNKEEPER] = { 
    optimalEnergy: 5000, 
    protoParts: [
        { type: CARRY, use: 'fact', factor: 0.50 },
        { type: MOVE,  use: 'fact', factor: 0.50 } 
    ] 
};
recipies[Static.ROLE_PUMP] = { 
    optimalEnergy: 5000, 
    protoParts: [        
        { type: CARRY, use: 'static', no: 1 },
        { type: MOVE,  use: 'static', no: 1 },
        { type: WORK,  use: 'fill' }
    ] 
};

var bodyCost = {};
bodyCost[MOVE] = 50;
bodyCost[WORK] = 100;
bodyCost[CARRY] = 50;
bodyCost[ATTACK] = 80;
bodyCost[RANGED_ATTACK] = 150;
bodyCost[HEAL] = 250;
bodyCost[CLAIM] = 600;
bodyCost[TOUGH] = 10;


module.exports = CreepFactory;