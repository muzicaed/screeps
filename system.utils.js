
var Utils = {
    
    createGameObjArr: function(ids) {
        var objArr = [];
        for (var i = 0; i < ids.length; i++) {
            var obj = Game.getObjectById(ids[i]);
            objArr.push(obj)
        }    
        return objArr;
    },
    
    createIdArray: function(objList) {
        var idArr = [];
        for(var i = 0; i < objList.length; i++) {
            idArr.push(objList[i].id);
        }
        return idArr;
    },
    
    objListToArray: function(objList) {
        var arr = [];
        for(var i in objList) {
            arr.push(objList[i]);
        }
        return arr;
    }      
};

module.exports = Utils;