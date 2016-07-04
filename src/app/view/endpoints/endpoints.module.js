(function() {
  'use strict';

  angular
    .module('app.view.endpoints', [
      'app.view.endpoints.dashboard',
      'app.view.endpoints.hcf',
      'app.view.endpoints.hce'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoints', {
      url: '/endpoints',
      abstract: true,
      template : '<div ui-view></div>'
    });
  }

})();
