exampleCollection = new Meteor.Collection('_example_collection');

if (Meteor.isServer) {
    Meteor.startup(function() {
        exampleCollection.remove({});
        for (var i = 0; i < 1000; i++) {
            exampleCollection.insert({ rowNum : i, data_1 : Math.random().toString(36).substring(13), data_2 : Math.random().toString(36).substring(13)});
        }
    });
}

if (Meteor.isClient) {
    Template.body.helpers({
        setup : function() {
            var _columns = [
                {
                    name : 'Row Number',
                    varName : 'rowNum',
                    class : 'row-number custom-td'
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
                row_class : 'custom-row'
            };
            return _.extend(this, { columns : _columns , css : _css });
        }
    });
}
