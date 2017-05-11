var Static = require('system.static');
var Finder = require('system.finder');
var BaseHQ = require('base.hq');
var Claimer = require('role.claimer');
var Colonizer = require('role.colonizer');
var Harvester = require('role.harvester');
var Transporter = require('role.transporter');
var ConstructionCentral = require('central.construction');
var RoadsCentral = require('central.roads');
var RepairCentral = require('central.repair');

var HarvestOperation = {

	run: function(operation) {
		updateOperation(operation);	
		if (operation.constructionSiteId === null && operation.containerId === null) {
			buildContainer(operation);
		}
		handleCreepSpawn(operation);
		rebuildRoads(operation);
	},

	create: function (spec) {
		// Create operation object here.
		var targetRoom = Game.rooms[spec.targetRoom];
		return {
			'ownerRoom': spec.ownerRoom,
			'targetRoom': spec.targetRoom,
			'controllerId': spec.controllerId,
			'sourceId': spec.sourceId,
			'containerId': null,
			'constructionSiteId': null,
			'claimCreep': null,
			'harvesterCreep': null,
			'colonizerCreep': null,
			'transporterCreeps': []
		};
	},

	isCompleted(operation) {
		return false;
	},

	isStartup(operation) {
		return (operation.containerId === null);
	}
};

function updateOperation(operation) {
	if(Game.time % 15 == 0) {
		var room = Game.rooms[operation.targetRoom];
		if (room !== undefined) {
			var sites = room.find(FIND_MY_CONSTRUCTION_SITES);
			operation.constructionSiteId = (sites.length > 0) ? sites[0].id : null;	

			var source = Game.getObjectById(operation.sourceId);
			var containers = Finder.findContainersInRange(source.pos, 1);
			operation.containerId = (containers.length > 0) ? containers[0].id : null;	
		}	

		operation.claimCreep = checkCreep(operation.claimCreep);
		operation.harvesterCreep = checkHarvesterCreep(operation);
		operation.colonizerCreep = checkCreep(operation.colonizerCreep);
		var i = operation.transporterCreeps.length;
		while (i--) {
	    	var transporter = operation.transporterCreeps.pop();
	    	if (checkCreep(transporter) !== null) {
	    		operation.transporterCreeps.push(transporter);
	    	}
		}
	}	
}

function buildContainer(operation) {
	var targetRoom = Game.rooms[operation.targetRoom];
	var ownerRoom = Game.rooms[operation.ownerRoom];
	var source = Game.getObjectById(operation.sourceId);
    var potentialTiles = [];
    if (targetRoom !== undefined && source !== null) {    	
	    var tiles = targetRoom.lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);	    
	    for (var j in tiles) {
	        var tileObj = tiles[j];
	        if (tileObj.type == 'terrain' && (tileObj.terrain == 'plain' || tileObj.terrain == 'swamp')) {
	        	var pos = targetRoom.getPositionAt(tileObj.x, tileObj.y);
		    	if (ConstructionCentral.order(targetRoom, STRUCTURE_CONTAINER, pos)) {  
		    		RoadsCentral.placeOrder(targetRoom, pos, ownerRoom.firstSpawn().pos);
		    		RoadsCentral.placeOrder(ownerRoom, ownerRoom.firstSpawn().pos, pos);
		    	}            
		    	return
	        }
	    } 
    }
}

function rebuildRoads(operation) {
	var targetRoom = Game.rooms[operation.targetRoom];
	var ownerRoom = Game.rooms[operation.ownerRoom];	
	if(Game.time % 5000 == 0 && targetRoom !== undefined && operation.containerId !== null) {
		var container = Game.getObjectById(operation.containerId);
		RoadsCentral.placeOrder(targetRoom, container.pos, ownerRoom.firstSpawn().pos);
		RoadsCentral.placeOrder(ownerRoom, ownerRoom.firstSpawn().pos, container.pos);	
		console.log('Rebuild roads');	
	}
}

function handleCreepSpawn(operation) {
	var ownerRoom = Game.rooms[operation.ownerRoom];
    if (Game.time % 10 == 0 && !ownerRoom.memory.SYS.didSpawn) {    	
    	var targetRoom = Game.rooms[operation.targetRoom];
    	if (ownerRoom !== undefined && BaseHQ.currentBaseEnergy(ownerRoom) > 2000) {
    		if (handleClaimSpawn(ownerRoom, targetRoom, operation)) { return; }
    		if (handleHarvesterSpawn(ownerRoom, operation)) { return; }
    		if (handleTransporterSpawn(ownerRoom, operation)) { return; } 
    		if (handleColonizerSpawn(ownerRoom, operation)) { return; } 
    	}
    }
}

function handleClaimSpawn(ownerRoom, targetRoom, operation) {	
	if (shouldSpawnClaimer(targetRoom, operation)) { 
		operation.claimCreep = Claimer.create(ownerRoom, operation.targetRoom, Static.ROLE_RESERVER);
		return true;
	} 
	return false;
}

function handleHarvesterSpawn(ownerRoom, operation) {
	if (operation.harvesterCreep === null) {		
		operation.harvesterCreep = Harvester.create(ownerRoom, { sourceId: operation.sourceId, containerId: operation.containerId })
		return true;
	} 
	return false;
}

function handleTransporterSpawn(ownerRoom, operation) {
	if (shouldSpawnTransporter(operation)) {
		var name = Transporter.create(ownerRoom, Static.ROLE_CIV_TRANSPORTER, operation.containerId);     
		if (name !== null) {
			operation.transporterCreeps.push(name);
			return true;
		}
	}
	return false;
}

function handleColonizerSpawn(ownerRoom, operation) {
	var targetRoom = Game.rooms[operation.targetRoom];
	if (shouldSpawnColonizer(ownerRoom, operation)) {
		operation.colonizerCreep = Colonizer.create(ownerRoom, operation.targetRoom);
		return true;
	} 	
	return false;
}

function shouldSpawnClaimer(targetRoom, operation) {
	if (targetRoom !== undefined && targetRoom.controller.reservation !== undefined) {
		return (
			operation.claimCreep === null && (
				targetRoom.controller.reservation.username !== 'muzicaed' || 
				targetRoom.controller.reservation.ticksToEnd < 1500 				
			)
		);
	}
	return true;
}

function shouldSpawnColonizer(ownerRoom, operation) {
	if (operation.colonizerCreep !== null && ownerRoom !== undefined) {
		return false;
	}
	return (
		operation.containerId === null ||
		RepairCentral.hasRepairNeed(ownerRoom) || 
		ConstructionCentral.hasConstructionOrders(ownerRoom)
	);
}

function checkHarvesterCreep(operation) {
	var check = checkCreep(operation.harvesterCreep);
	if (check === null) {
		console.log('harvesterCheck was null... searching replacement...');
	    for (var name in Game.creeps) {
	        var creep = Game.creeps[name];
	        if (creep.memory.role == Static.ROLE_HARVESTER && creep.memory.assignedToSourceId == operation.sourceId) {
	        	console.log('Found replacement');
	            return creep.name;
	        }
	    }		
	}
	return check;
}

function shouldSpawnTransporter(operation) {
	if (operation.containerId !== null) {
		var container = Game.getObjectById(operation.containerId);
		return (container.store.energy > 1900);
	}
	return false;
}

function checkCreep(creepName) {
	if (Game.creeps[creepName] === undefined) {
		return null;
	}
	return creepName;
}

module.exports = HarvestOperation;