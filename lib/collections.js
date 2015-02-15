Counts = new Meteor.Collection('_cs_counts');

if (Meteor.isServer) {
    var _publicationsMap = {}
    var _pub_expiration = 10;
    Meteor.methods({
        _cs_createPublication : function(_src) {
            var _collection = getCollection(_src);
            if (_publicationsMap[_collection] == undefined) {
                _publicationsMap[_collection] = (new Date).getTime();

                Meteor.publish(_src + '_count', function() {
                    var countsStr = _src + '_count';
                    var self = this, first = true;
                    var count = function() {
                        var thisCount = _collection.find().count();
                        if (first) {
                            self.added('_cs_counts', countsStr, {count: thisCount});
                        } else {
                            self.changed('_cs_counts', countsStr, {count: thisCount});
                        }
                        first = false;
                    }
                    var timeout = Meteor.setInterval(count, 1000); // every 1s
                    count();
                    self.ready();

                    self.onStop(function() {
                        Meteor.clearTimeout(timeout)
                    });
                });

                Meteor.publish(_src, function(_offset, _limit, _sortVar, _sort) {
                    var args = { skip : _offset, limit : _limit, sort : {} };
                    args.sort[_sortVar] = _sort;
                    return _collection.find({}, args);
                });
            }
        }
    });
}

getCollection = function(collectionName, createIfNotExist) {
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
    if (createIfNotExist != undefined && createIfNotExist == true) {
        return new Meteor.Collection(collectionName);
    } else {
        throw Meteor.Error(500, "No collection named " + collectionName);
    }
};
