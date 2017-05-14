var Utils = {
    
    createGameObjArr: function (ids) {
        var objArr = [];
        for (var i = 0; i < ids.length; i++) {
            var obj = Game.getObjectById(ids[i]);
            objArr.push(obj)
        }    
        return objArr;
    },
    
    createIdArray: function (objArr) {
        var idArr = [];
        for(var i = 0; i < objArr.length; i++) {
            idArr.push(objArr[i].id);
        }
        return idArr;
    },
    
    objListToArray: function (objList) {
        var arr = [];
        for(var i in objList) {
            arr.push(objList[i]);
        }
        return arr;
    },

    orderKeys: function (obj) {

      var keys = Object.keys(obj).sort(function keyOrder(k1, k2) {
          if (k1 < k2) return -1;
          else if (k1 > k2) return +1;
          else return 0;
      });

      var i, after = {};
      for (i = 0; i < keys.length; i++) {
        after[keys[i]] = obj[keys[i]];
        delete obj[keys[i]];
      }

      for (i = 0; i < keys.length; i++) {
        obj[keys[i]] = after[keys[i]];
      }
      return obj;
    }        
};

module.exports = Utils;