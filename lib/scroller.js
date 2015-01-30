Helpers = {}
Template.registerHelper('CS', Helpers);
Helpers.Datatable = Template._cs_datatable;

var _CS_DEFAULT_LIMIT = 80; // Should be a multiple of 4 for nice math
var _CS_DEFAULT_OFFSET = 0;
var _CS_TOP_TRIGGER = _CS_DEFAULT_LIMIT / 4;
var _CS_BOTTOM_TRIGGER = 3 * _CS_DEFAULT_LIMIT / 4;
var _CS_ROW_HEIGHT = 0;
var _CS_TH_HEIGHT = 0;
var _CS_NUM_DISPLAYED_ROWS = 0;
var _CS_CURRENT_SUB = undefined;
var _CS_CURRENT_TOP = 0;

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
        if (atts.inclHeaders == undefined) atts.inclHeaders = false;

        var _src = atts.src;
        var _offsetStr = varStr(_src, '_offset');
        var _limitStr = varStr(_src, '_limit');
        var _heightStr = varStr(_src, '_height');
        var _sortStr = varStr(_src, '_sort');
        Session.set(_offsetStr, atts.offset);
        Session.set(_limitStr, atts.limit);
        Session.set(_heightStr, 0);
        Session.set(_sortStr, atts.sortVar);
        
        Meteor.call('_cs_createPublication', _src);
        
        return _.extend(atts, { offsetStr : _offsetStr, limitStr : _limitStr , heightStr : _heightStr , sortStr : _sortStr });
    },

    getData : function() {
        var offset = Session.get(this.offsetStr);
        var limit = Session.get(this.limitStr);
        var sortVar = Session.get(this.sortStr);
        _CS_CURRENT_SUB = Meteor.subscribe(this.src, offset, limit, sortVar, this.sort);
    },

    table_pos : function() {
        var offset = Session.get(this.offsetStr);
        if (_CS_CURRENT_SUB.ready()) {
            var table_top = offset * _CS_ROW_HEIGHT;
            if (this.inclHeaders) {
                table_top += (_CS_TH_HEIGHT - _CS_ROW_HEIGHT) * offset;
            }
            _CS_CURRENT_TOP = table_top;
        }
        return { top : _CS_CURRENT_TOP };
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

Template._cs_datatable_table_headers.helpers({
    headers : function() {
        return this.columns;
    }
});

Template._cs_datatable_table_body.helpers({
    rows : function() {
        var tlContext = Template.parentData(1);
        var _collection = getCollection(tlContext.src);
        
        var _offset = Session.get(this.offsetStr);
        var _limit = Session.get(this.limitStr);

        var args = {};
        //var args = {skip : 0, limit : _limit};
        if (this.sortVar != '') {
            _.extend(args, {sort:{}});
            args.sort[Session.get(this.sortStr)] = this.sort;
            return _collection.find({}, args);
        } else {
            return _collection.find({}, args);
        }
    }
});

Template._cs_datatable_table_body_row.helpers({
    cells : function() {
        var tlContext = Template.parentData(2);
        return tlContext.columns;
    },

    cell_data : function() {
        var data_context = Template.parentData(1);
        var context = { class : this.class };
        if (this.transform != undefined) {
            _.extend(context, { data : this.transform(data_context[this.varName]) });
        } else {
            _.extend(context, { data : data_context[this.varName] });
        }
        return context;
    }
});

Template._cs_datatable_table_body_row.rendered = function() {
    var self = this;
    var tr = $(self.find('.cs_tr'));
    if (_CS_ROW_HEIGHT != tr.height()) {
        _CS_ROW_HEIGHT = tr.height();
        var container = tr.closest('.cs_table_container');
        var src = Template.parentData(1).src;
        var inclHeaders = Template.parentData(1).inclHeaders;
        Meteor.call('_cs_getCollectionSize', src, function(err, result) {
            if (!err) {
                var totalHeight = result * _CS_ROW_HEIGHT;
                if (inclHeaders) {
                    totalHeight += (_CS_TH_HEIGHT - _CS_ROW_HEIGHT) * result;
                }
                container.height(totalHeight + 'px');
                Session.set(varStr(src, '_height'), totalHeight);
            } else {
                throw Meteor.Error(500, err);
            }
        });
    }
}

Template._cs_datatable_table_headers.rendered = function() {
    var self = this;
    var tr = $(self.find('.cs_tr'));
    if (_CS_TH_HEIGHT != tr.height()) {
        _CS_TH_HEIGHT = tr.height();
    }
}

var varStr = function(src, var_name) { return '_' + src + var_name };
