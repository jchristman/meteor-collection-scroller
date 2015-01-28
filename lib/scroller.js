Helpers = {}
Template.registerHelper('CS', Helpers);
Helpers.Datatable = Template._cs_datatable;

var _CS_DEFAULT_LIMIT = 80; // Should be a multiple of 4 for nice math
var _CS_DEFAULT_OFFSET = 0;
var _CS_TOP_TRIGGER = _CS_DEFAULT_LIMIT / 4;
var _CS_BOTTOM_TRIGGER = 3 * _CS_DEFAULT_LIMIT / 4;
var _CS_ROW_HEIGHT = 0;
var _CS_SUBS = new SubsManager({ cacheLimit : 3 , expireIn : 10 });

Template._cs_datatable.rendered = function() {
    var self = this;
    var container = $(this.find('.cs_table_container'));
    _CS_ROW_HEIGHT = container.find('.cs_tr').height();
    Meteor.call('_cs_getCollectionSize', this.data.src, function(err, result) {
        if (!err) {
            var totalHeight = result * _CS_ROW_HEIGHT;
            container.height(totalHeight + 'px');
            Session.set(varStr(self.data.src, '_height'), totalHeight);
        } else {
            throw Meteor.Error(500, err);
        }
    });
}

Template._cs_datatable.helpers({
    setup : function(atts) {
        if (atts.src == undefined) {
            throw Meteor.Error(500, 'Must define a data source for the table!');
            return;
        }
        if (atts.columns == undefined) {
            throw Meteor.Error(500, 'Must define the columns of the data table.');
            return;
        }
        if (atts.sortVar == undefined) {
            throw Meteor.Error(500, 'Must define a sortVar context (column name). This is required for oplog tailing, which is more efficient.');
            return;
        }
        if (atts.sort == undefined) atts.sort = 1; // Ascending
        if (atts.limit == undefined) atts.limit = _CS_DEFAULT_LIMIT;
        if (atts.offset == undefined) atts.offset = _CS_DEFAULT_OFFSET;

        var _src = atts.src;
        var _offsetStr = varStr(_src, '_offset');
        var _limitStr = varStr(_src, '_limit');
        var _heightStr = varStr(_src, '_height');
        var _sortStr = varStr(_src, '_sort');
        Session.set(_offsetStr, atts.offset);
        Session.set(_limitStr, atts.limit);
        Session.set(_heightStr, 0);
        Session.set(_sortStr, atts.sortVar);

        return _.extend(atts, { offsetStr : _offsetStr, limitStr : _limitStr , heightStr : _heightStr , sortStr : _sortStr });
    },

    getData : function() {
        var self = this;
        var offset = Session.get(self.offsetStr);
        var sub_name = createSubName(self.src, offset);
        var limit = Session.get(self.limitStr);
        var sortVar = Session.get(self.sortStr);
        if (!_CS_SUBS.isCached(sub_name, offset, limit, sortVar, self.sort)) {
            Meteor.call('_cs_createPublication', self.src, offset, function(error, result) {
                _CS_SUBS.subscribe(sub_name, offset, limit, sortVar, self.sort);
            });
        } else {
            _CS_SUBS.subscribe(sub_name, offset, limit, sortVar, self.sort);
        }
    },

    headers : function() {
        return this.columns;
    },

    rows : function() {
        var tlContext = Template.parentData(1);
        var _collection = getCollection(tlContext.src);
        
        var _offset = Session.get(this.offsetStr);
        var _limit = Session.get(this.limitStr);

        var hashes = _CS_SUBS.getCacheHashes();
        var clientOffset = 0;
        var overlapHelper = 0;
        console.log(hashes.length);
        _.each(hashes, function(hash) {
            var hashArgs = EJSON.parse(hash);
            var cachedOffset = hashArgs[1];
            var cachedLimit = hashArgs[2];
            // We only need to look at the cached data if it's not part of something else
            if (overlapHelper <= cachedOffset) {
                if (cachedOffset < _offset) {
                    clientOffset += Math.min(_offset - cachedOffset, cachedLimit);
                    overlapHelper = cachedOffset + cachedLimit;
                }
            } else {
                if (cachedOffset + cachedLimit > overlapHelper && overlapHelper < _offset) {
                    clientOffset += Math.min(cachedOffset + cachedLimit - overlapHelper, _offset - overlapHelper);
                    overlapHelper = cachedOffset + cachedLimit;
                }
            }
        }); 
        
        var args = {skip : clientOffset, limit : _limit};
        if (this.sortVar != '') {
            _.extend(args, {sort:{}});
            args.sort[Session.get(this.sortStr)] = this.sort;
            return _collection.find({}, args);
        } else {
            return _collection.find({}, args);
        }
    },

    cells : function() {
        var tlContext = Template.parentData(2);
        return tlContext.columns;
    },

    cell_data : function() {
        var data_context = Template.parentData(1);
        return { class : this.class, data : data_context[this.varName] };
    },

    table_pos : function() {
        var offset = Session.get(this.offsetStr);
        var table_top = offset * _CS_ROW_HEIGHT;
        return { top : table_top };
    }
});

Template._cs_datatable.events({
    'scroll .cs_container' : function(event) {
        var target = $(event.target);

        var height = Session.get(this.heightStr);
        var offset = Session.get(this.offsetStr);
        var row_height = target.find('.cs_tr').height();

        var top_trigger = offset + _CS_TOP_TRIGGER;
        var bottom_trigger = offset + _CS_BOTTOM_TRIGGER;
        var cur_top = Math.round(target.scrollTop() / row_height);
        var cur_bottom = Math.round((target.scrollTop() + target.height()) / row_height);

        var newOffset = offset;
        while (cur_top < top_trigger) {
            newOffset -= _CS_DEFAULT_LIMIT / 4;
            cur_top += _CS_DEFAULT_LIMIT / 4;
        } 
        while (cur_bottom > bottom_trigger) {
            newOffset += _CS_DEFAULT_LIMIT / 4;
            cur_bottom -= _CS_DEFAULT_LIMIT / 4;
        }
        newOffset = Math.max(0, newOffset);

        Session.set(this.offsetStr, newOffset);
    }
});

var varStr = function(src, var_name) { return '_' + src + var_name };
