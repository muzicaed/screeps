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
		if (operation.constructionSiteId === null) {
			buildContainer(operation);
		}
		handleCreepSpawn(operation);
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
		operation.harvesterCreep = checkCreep(operation.harvesterCreep);
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

function handleCreepSpawn(operation) {
    if (Game.time % 10 == 0) {
    	var ownerRoom = Game.rooms[operation.ownerRoom];
    	var targetRoom = Game.rooms[operation.targetRoom];
    	if (ownerRoom !== undefined && BaseHQ.currentBaseEnergy(ownerRoom) > 2000) {
    		if (!handleClaimSpawn(ownerRoom, targetRoom, operation)) {
    			if (operation.containerId !== null) {
    				if (!handleHarvesterSpawn(ownerRoom, operation)) {
    					handleTransporterSpawn(ownerRoom, operation);
    				}				
    			}
    			handleColonizerSpawn(ownerRoom, operation);
    		}
    	}
    }
}

function handleClaimSpawn(ownerRoom, targetRoom, operation) {	
	if (operation.claimCreep === null) { 
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
	if (operation.transporterCreeps.length < 2) {
		var name = Transporter.create(ownerRoom, Static.ROLE_CIV_TRANSPORTER, operation.containerId);     
		if (name !== null) {
			operation.transporterCreeps.push(name);	
		}
	}	
}

function handleColonizerSpawn(ownerRoom, operation) {
	var targetRoom = Game.rooms[operation.targetRoom];
	if (operation.colonizerCreep === null && (operation.containerId === null || operation.transporterCreeps.length == 3)) {
		operation.colonizerCreep = Colonizer.create(ownerRoom, operation.targetRoom)
	} 	
}

function checkCreep(creepName) {
	if (Game.creeps[creepName] === undefined) {
		return null;
	}
	return creepName;
}

module.exports = HarvestOperation;