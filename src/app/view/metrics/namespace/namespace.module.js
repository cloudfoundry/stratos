(function () {
  'use strict';
  angular
    .module('app.view.metrics.dashboard.namespace', [
      'app.view.metrics.dashboard.namespace.details'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('metrics.dashboard.namespace', {
      url: '/:namespaceName',
      abstract: true,
      template: '<ui-view/>'
    });
  }
})();
