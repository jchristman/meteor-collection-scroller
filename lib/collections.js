if (Meteor.isServer) {
    var _publicationsMap = {}
    Meteor.methods({
        _cs_createPublication : function(_src) {
            var _collection = getCollection(_src);
            if (_publicationsMap[_collection] == undefined) {
                Meteor.publish(_src, function(_offset, _limit) {
                    return _collection.find({}, { skip : _offset, limit : _limit});
                });
                _publicationsMap[_collection] = true;
            }
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

