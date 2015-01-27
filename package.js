Package.describe({
  name: 'jchristman:collection-scroller',
  summary: 'Scroll a *large* collection as if it were all downloaded at once',
  version: '1.0.0',
  git: 'https://github.com/suntzuII/meteor-collection-scroller'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');

  api.use('underscore', 'client');
  api.use('templating', 'client');
  api.use('jquery','client');
  api.use('meteorhacks:kadira@2.17.1');

  api.addFiles([
        'server/kadira.js'
  ],['server']);

  api.addFiles([
        'lib/scroller.html',
        'lib/scroller.js',
        'lib/scroller.css'
  ],['client']);

  api.addFiles([
        'lib/collections.js'
  ],['client','server']);

  api.export([
        'ApplicationManager',
        'AppManager',
        'AppCollection',
        'Application',
        'CONTEXT_MENU_FUNCS'
  ], ['client','server']); 
});
