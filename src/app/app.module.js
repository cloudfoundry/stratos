(function () {
  'use strict';

  angular
    .module('app', [
      'app.api',
      'app.event',
      'app.model',
      'app.view'
    ])
    .constant('app.basePath', 'app/');

})();
