Helpers = {}
Template.registerHelper('CS', Helpers);
Helpers.Datatable = Template._cs_datatable;

Template._cs_datatable.rendered = function() {
    var self = this;
    var container = $(this.find('.cs_table_container'));
    var row_height = container.find('.cs_tr').height();
    Meteor.call('_cs_getCollectionSize', this.data.src, function(err, result) {
        if (!err) {
            var totalHeight = result * row_height;
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
        var top = target.scrollTop();
        var top_percent = top / Session.get(varStr(this.src, '_height'));

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

        var _src = atts.src;
        var _offsetStr = varStr(_src, '_offset');
        var _limitStr = varStr(_src, '_limit');
        var _heightStr = varStr(_src, '_height');
        Session.set(_offsetStr, 0);
        Session.set(_limitStr, 50);
        Session.set(_heightStr, 0);

        Meteor.call('_cs_createPublication', _src);

        return _.extend(this, { offsetStr : _offsetStr, limitStr : _limitStr });
    },

    getData : function() {
        Meteor.subscribe(this.src, Session.get(this.offsetStr), Session.get(this.limitStr));
    },

    headers : function() {
        return this.columns;
    },

    rows : function() {
        var tlContext = Template.parentData(1);
        var _collection = getCollection(tlContext.src);
        return _collection.find();
    },

    cells : function() {
        var tlContext = Template.parentData(2);
        return tlContext.columns;
    },

    cell_data : function() {
        var data_context = Template.parentData(1);
        return { class : this.class, data : data_context[this.varName] };
    }
});

var varStr = function(src, var_name) { return '_' + src + var_name };
