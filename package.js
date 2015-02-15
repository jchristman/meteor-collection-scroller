Package.describe({
  name: 'jchristman:collection-scroller',
  summary: 'Scroll a *large* collection as if it were all downloaded at once',
  version: '1.0.7_1',
  git: 'https://github.com/jchristman/meteor-collection-scroller'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');

  api.use('underscore', 'client');
  api.use('templating', 'client');
  api.use('jquery','client');
  //api.use('tmeasday:publish-counts@0.3.4');

  api.addFiles([
        'lib/scroller.html',
        'lib/scroller.js',
        'lib/scroller.css'
  ],['client']);

  api.addFiles([
        'lib/collections.js'
  ],['client','server']);

  api.export([
        '_CS_Counts'
  ],['client']);
});
