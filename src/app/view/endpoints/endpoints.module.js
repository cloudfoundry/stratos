(function() {
  'use strict';

  angular
    .module('app.view.endpoints', [ ])
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
