if (Meteor.isServer) {
    var _publicationsMap = {}
    var _pub_expiration = 10;
    Meteor.methods({
        _cs_createPublication : function(_src) {
            var _collection = getCollection(_src);
            if (_publicationsMap[_collection] == undefined) {
                Meteor.publish(_src, function(_offset, _limit, _sortVar, _sort) {
                    var countsStr = _src + '_count';
                    Counts.publish(this, countsStr, _collection.find(), { noReady : true });

                    var args = { skip : _offset, limit : _limit, sort : {} };
                    args.sort[_sortVar] = _sort;
                    return _collection.find({}, args);
                });
                _publicationsMap[_collection] = (new Date).getTime();
            }
        },

        _cs_getCollectionSize : function(_src) {
            var _collection = getCollection(_src);
            return _collection.find({}).count();
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
