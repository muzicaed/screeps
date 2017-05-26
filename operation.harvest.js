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
	    checkAttack(operation);
		updateOperation(operation);	
		if (operation.constructionSiteIds.length == 0 && !isContainersBuilt(operation)) {
			console.log('Harvest op. build containers in ' + operation.targetRoom);
			buildContainers(operation);
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
			'constructionSiteIds':[],
			'sources': createSources(spec.sourceIds),
			'claimCreep': null,
			'colonizerCreep': null,
			'underAttackTicks': 0
		};
	},

	isCompleted(operation) {
		return false;
	},

	isStartup(operation) {
		return !isContainersBuilt(operation);
	}
};

function createSources(sourceIds) {
	var returnObj = {};
	for (var i = 0; i < sourceIds.length; i++) {
		returnObj[sourceIds[i]] = {
			'sourceId': sourceIds[i],
			'containerId': null,
			'harvesterCreep': null,
			'transporterCreeps': []
		};
	}
	return returnObj;
}

function updateOperation(operation) {
	if(Game.time % 15 == 0) {
		var room = Game.rooms[operation.targetRoom];
		updateConstructionSites(room, operation);
		updateSources(operation);
		operation.claimCreep = checkCreep(operation.claimCreep);
		operation.colonizerCreep = checkCreep(operation.colonizerCreep);
	}	
}

function updateConstructionSites(room, operation) {
	if (room !== undefined) {
		operation.constructionSiteIds = [];
		var sites = room.find(FIND_MY_CONSTRUCTION_SITES);
		for(var i = 0; i < sites.length; i++) {
			operation.constructionSiteIds.push(sites[0].id);	
		}	
	}
}

function updateSources(operation) {
	for(var sourceId in operation.sources) {
		var sourceObj = operation.sources[sourceId];
		var source = Game.getObjectById(sourceId);
		if (source !== null) {
			var containers = Finder.findContainersInRange(source.pos, 1);
			sourceObj.containerId = (containers.length > 0) ? containers[0].id : null;				
			sourceObj.harvesterCreep = checkHarvesterCreep(sourceObj);
			var i = sourceObj.transporterCreeps.length;
			while (i--) {
		    	var transporter = sourceObj.transporterCreeps.pop();
		    	if (checkCreep(transporter) !== null) {
		    		sourceObj.transporterCreeps.push(transporter);
		    	}
			}	
		}	
	}
}

function buildContainers(operation) {
	var targetRoom = Game.rooms[operation.targetRoom];
	var ownerRoom = Game.rooms[operation.ownerRoom];

	for(var sourceId in operation.sources) {
		var source = Game.getObjectById(sourceId);
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
			    	break;           
		        }
		    } 
	    }		
	}
}

function rebuildRoads(operation) {
	var targetRoom = Game.rooms[operation.targetRoom];
	var ownerRoom = Game.rooms[operation.ownerRoom];
	for(var sourceId in operation.sources) {
		var source = Game.getObjectById(sourceId);		
		if (Game.time % 5000 == 0 && targetRoom !== undefined && source.containerId !== null) {
			var container = Game.getObjectById(source.containerId);
			RoadsCentral.placeOrder(targetRoom, container.pos, ownerRoom.firstSpawn().pos);
			RoadsCentral.placeOrder(ownerRoom, ownerRoom.firstSpawn().pos, container.pos);	
			console.log('Rebuild roads');	
		}
	}
}

function handleCreepSpawn(operation) {
	if (operation.underAttackTicks == 0) {
		var ownerRoom = Game.rooms[operation.ownerRoom];
	    if (Game.time % 10 == 0 && !ownerRoom.memory.SYS.didSpawn) {    	
	    	var targetRoom = Game.rooms[operation.targetRoom];
	    	if (ownerRoom !== undefined && BaseHQ.currentBaseEnergy(ownerRoom) > 10000) {
	    		if (handleClaimSpawn(ownerRoom, targetRoom, operation)) { return; }
	    		if (handleHarvesterSpawn(ownerRoom, operation)) { return; }
	    		if (handleTransporterSpawn(ownerRoom, operation)) { return; } 
	    		if (handleColonizerSpawn(ownerRoom, operation)) { return; } 
	    	}
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
	for(var sourceId in operation.sources) {
		var sourceObj = operation.sources[sourceId];
		if (sourceObj.harvesterCreep === null && sourceObj.containerId !== null) {		
			sourceObj.harvesterCreep = Harvester.create(ownerRoom, { sourceId: sourceId, containerId: sourceObj.containerId })
			return true;
		}
	} 
	return false;
}

function handleTransporterSpawn(ownerRoom, operation) {
	for(var sourceId in operation.sources) {
		var sourceObj = operation.sources[sourceId];	
		if (shouldSpawnTransporter(sourceObj)) {
			var name = Transporter.create(ownerRoom, Static.ROLE_CIV_TRANSPORTER, sourceObj.containerId);     
			if (name !== null) {
				sourceObj.transporterCreeps.push(name);
				return true;
			}
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
	return (operation.claimCreep === null);
}

function shouldSpawnColonizer(ownerRoom, operation) {
	if (operation.colonizerCreep !== null && ownerRoom !== undefined) {
		return false;
	}
	return (
		!isContainersBuilt(operation) ||
		RepairCentral.hasRepairNeed(ownerRoom) || 
		ConstructionCentral.hasConstructionOrders(ownerRoom)
	);
}

function checkHarvesterCreep(source) {
	var check = checkCreep(source.harvesterCreep);
	if (check === null) {
		console.log('harvesterCheck was null... searching replacement...');
	    for (var name in Game.creeps) {
	        var creep = Game.creeps[name];
	        if (creep.memory.role == Static.ROLE_HARVESTER && creep.memory.assignedToSourceId == source.sourceId) {
	        	console.log('Found replacement');
	            return creep.name;
	        }
	    }		
	}
	return check;
}

function shouldSpawnTransporter(source) {
	if (source.containerId !== null) {
		var container = Game.getObjectById(source.containerId);
		if (container !== null) {
			return (container.store.energy > 1900);
		}
	}
	return false;
}

function checkCreep(creepName) {
	if (Game.creeps[creepName] === undefined) {
		return null;
	} 
	return creepName;
}

function checkAttack(operation) {
	var targetRoom = Game.rooms[operation.targetRoom];
	if (targetRoom !== undefined) {
		var enemies = targetRoom.find(FIND_HOSTILE_CREEPS);
		if (enemies.length > 0) {
			operation.underAttackTicks = enemies[0].ticksToLive;
		} else {
			operation.underAttackTicks = 0;
		}
	}

	if (operation.underAttackTicks > 0) {
		operation.underAttackTicks--;
	}
}

function isContainersBuilt(operation) {
	for (var sourceId in operation.sources) {
		if (operation.sources[sourceId].containerId === null) {
			return false;
		}
	}
	return true;
}

module.exports = HarvestOperation;