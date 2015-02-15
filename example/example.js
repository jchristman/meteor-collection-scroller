exampleCollection = new Meteor.Collection('_example_collection');

if (Meteor.isServer) {
    Meteor.startup(function() {
        exampleCollection.remove({});
        Meteor.defer(function() {
            for (var i = 0; i < 10000; i++) {
                exampleCollection.insert({ rowNum : i, data_1 : Math.random().toString(36).substring(13), data_2 : Math.random().toString(36).substring(13)});
            }
        });
    });
}

if (Meteor.isClient) {
    Template.body.helpers({
        setup : function() {
            var _columns = [
                {
                    name : 'Row Number',
                    varName : 'rowNum',
                    class : 'row-number custom-td',
                    transform : rowNumTransform
                },
                {
                    name : 'Random Data 1',
                    varName : 'data_1',
                    class : 'data-1 custom-td'
                },
                {
                    name : 'Random Data 2',
                    varName : 'data_2',
                    class : 'data-2 custom-td'
                }
            ];
            var _css = {
                table_class : 'custom-table',
                row_class : 'custom-row'
            };
            return _.extend(this, { columns : _columns , css : _css });
        },

        count : function() {
            var count = _CS_Counts.findOne('_example_collection_count');
            if (count == undefined) return 0;
            return count.count;
        }
    });

    var rowNumTransform = function(_data) {
        var data = '<b>Row number: </b>' + _data;
        var html = new Handlebars.SafeString(data);
        return html;
    }
}
