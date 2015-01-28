if (Meteor.isServer) {
    var _publicationsMap = {}
    var _pub_expiration = 10;
    Meteor.methods({
        _cs_createPublication : function(_src, _id) {
            var _collection = getCollection(_src);
            var subName = createSubName(_src, _id);
            if (_publicationsMap[subName] == undefined) {
                Meteor.publish(subName, function(_offset, _limit, _sortVar, _sort) {
                    var sortArgs = { sort : {} };
                    sortArgs.sort[_sortVar] = _sort;
                    var args = { skip : _offset, limit : _limit };
                    _.extend(args, sortArgs);
                    return _collection.find({}, args);
                });
                _publicationsMap[subName] = (new Date).getTime();
            } else {
                _publicationsMap[subName] = (new Date).getTime();
            }
            Meteor.call('_cs_expirePublications');
        },

        _cs_getCollectionSize : function(_src) {
            var _collection = getCollection(_src);
            return _collection.find({}).count();
        },

        _cs_expirePublications : function() {
            var expireTime = (new Date).getTime() - _pub_expiration * 60 * 1000;
            _.each(_publicationsMap, function(val, key) {
                if (val < expireTime) delete _publicationsMap[key]; // Delete the publication if its old.
            });
        }
    });
}

getCollection = function(collectionName) {
    if(collectionName == "users"){
        return Meteor.users;
    }
    var globalScope = Meteor.isClient ? window : global;
    for(var property in globalScope){
        var object = globalScope[property];
        if(object instanceof Meteor.Collection && object._name == collectionName){
            return object;
        }
    }
    throw Meteor.Error(500, "No collection named " + collectionName);
};

createSubName = function(src, id) {
    return src + '_' + id;
}

