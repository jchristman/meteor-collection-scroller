meteor-collection-scroller
--------------------------

A library that uses partial subscriptions to dynamically load content from a Collection with *many* documents.

The main purpose of this library is address the problem of holding *HUGE* tables in a browser's memory. There are multiple issues that make this a difficult problem, primarily the fact that the data takes a long time to transfer and then it takes up a lot of RAM on each client. This library solves this problem by keeping only a small number of documents from the collection in the client's memory at a time. The box with the scrollbar calculates its height based on the number of documents in the collection. Then, as the user scrolls, it dynamically resubscribes to a different part of the collection.

This turns out to be decently smooth if you don't scroll *too* fast. An example that implements the below documentation can be found by checking out the example in the repository.

Installation
------------

meteor add jchristman:collection-scroller

Documentation
-------------

To create the infinite scrolling table, you will just need to set a context and then call the template CS.Datatable. The src, sortVar, and columns context variables are *required* for this library to function. The css, sort, limit, and offset context variables are optional.

```html
{{#with setup}}
    {{> CS.Datatable src='_example_collection' sortVar='rowNum' columns=columns css=css}}
{{/with}}
```

A full description of the context variables passed to the CS.Datatable template is shown below.

| Variable Name |    Type    |   Required   | Description |
|---------------|------------|--------------|-------------|
| src           | String     | true         | The string that you use to create the collection. For example, if you run ```exampleCollection = new Meteor.Collection('_example_collection');```, then you would pass '_example_collection' to the template. |
| sortVar       | String     | true         | A field of the collection to sort the collection by. This is required for meteor to set up an [oplog tailing](https://github.com/meteor/meteor/wiki/Oplog-Observe-Driver) driver, which is more efficient. |
| columns       | Array of Objects | true   | You should create an array of objects in the current context and pass it to the template that defines the columns you want displayed in the table. Each object should have a name, varName, class, and optional transform field. These options are explained in the table below. |
| css           | Object     | false        | You should create an object in the current context and pass it to the template that defines classes for the table. Its options are explained in a later table. |
| sort          | int        | false        | Can be a 1 or -1 for ascending or descending sort. Defaults to a 1. |
| limit         | int        | false        | The number of records to load at a time. *should* be a multiple of 4. Defaults to 80. |
| offset        | int        | false        | The offset within the collection to start at. Defaults to 0. |
| inclHeaders   | boolean    | false        | Whether the headers should be included. Defaults to false. |

The columns object should have the following fields in each of the "columns" objects.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| name | String | true | A field which defines the column name, should you choose to include the column headers. |
| varName | String | true | The name of the field of the collection from which to load the column. |
| class | String | false | The name of the class to add to each table data cell. |
| transform | Function | false | Pass a function pointer to the library. It accepts one parameter and returns a transformation of the data. |

The optional css context object is allowed to have the following fields.

| Fields Name | Type | Description |
|-------------|------|-------------|
| row\_class | String | A name of a class with which to decorate each row. |
