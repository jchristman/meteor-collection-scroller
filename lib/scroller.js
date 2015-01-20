Helpers = {}
Template.registerHelper('CS', Helpers);
Helpers.Datatable = Template._cs_datatable;

var _CS_DEFAULT_LIMIT = 70;
var _CS_DEFAULT_OFFSET = 0;
var _CS_UPPER_SCROLL_LIMIT = 0.50;
var _CS_LOWER_SCROLL_LIMIT = 0.40;
var _CS_ROW_HEIGHT = 0;

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

Template._cs_datatable.events({
    'scroll .cs_container' : function(event) {
        var target = $(event.target);

        var height = Session.get(this.heightStr);
        var offset = Session.get(this.offsetStr);
        var row_height = target.find('.cs_tr').height();

        var scrollTopPercent = target.scrollTop() / height;

        var upperLimit = ((_CS_UPPER_SCROLL_LIMIT * _CS_DEFAULT_LIMIT) + offset) * row_height / height;
        var lowerLimit = ((_CS_LOWER_SCROLL_LIMIT * _CS_DEFAULT_LIMIT) + offset) * row_height / height;
        var middle = (upperLimit + lowerLimit) / 2;

        var newOffset = offset;
        if (scrollTopPercent < lowerLimit) {
            newOffset -= (middle - scrollTopPercent) * height / row_height;
        } else if (scrollTopPercent > upperLimit) {
            newOffset += (scrollTopPercent - middle) * height / row_height;
        }
        if (newOffset < 0) newOffset = 0;
        newOffset = Math.round(newOffset);   

        console.log(upperLimit, lowerLimit, scrollTopPercent, newOffset);
        Session.set(this.offsetStr, newOffset);
    }
});

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
        if (atts.sortVar == undefined) atts.sortVar = '';
        if (atts.sort == undefined) atts.sort = 1; // Ascending
        if (atts.limit == undefined) atts.limit = _CS_DEFAULT_LIMIT;
        if (atts.offset == undefined) atts.offset = _CS_DEFAULT_OFFSET;

        var _src = atts.src;
        var _offsetStr = varStr(_src, '_offset');
        var _limitStr = varStr(_src, '_limit');
        var _heightStr = varStr(_src, '_height');
        Session.set(_offsetStr, atts.offset);
        Session.set(_limitStr, atts.limit);
        Session.set(_heightStr, 0);

        Meteor.call('_cs_createPublication', _src);

        return _.extend(atts, { offsetStr : _offsetStr, limitStr : _limitStr , heightStr : _heightStr });
    },

    getData : function() {
        Meteor.subscribe(this.src, Session.get(this.offsetStr), Session.get(this.limitStr));
    },

    headers : function() {
        return this.columns;
    },

    rows : function() {
        var trigger = Session.get(this.offsetStr);
        var tlContext = Template.parentData(1);
        var _collection = getCollection(tlContext.src);
        if (this.sortVar != '') {
            var args = {sort : {}};
            args.sort[this.sortVar] = this.sort;
            return _collection.find({}, args);
        } else {
            return _collection.find();
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

var varStr = function(src, var_name) { return '_' + src + var_name };
