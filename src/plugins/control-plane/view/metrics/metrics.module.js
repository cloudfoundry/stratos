(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics', [
      'control-plane.view.metrics.dashboard',
      'nvd3'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics', {
      url: '/:guid',
      abstract: true,
      template: '<ui-view/>',
      data: {
        activeMenuState: 'cp.list'
      }
    });
  }

})();
