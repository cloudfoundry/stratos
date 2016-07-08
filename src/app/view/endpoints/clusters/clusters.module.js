(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters', [
      'app.view.endpoints.clusters.cluster',
      'app.view.endpoints.clusters.tiles'
    ])
    .config(registerRoute)
    .run(register);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters', {
      url: '/cluster',
      abstract: true,
      template: '<ui-view/>'
    });
  }

  register.$inject = [ ];

  function register() {
    return new Clusters();
  }

  function Clusters() {}

  angular.extend(Clusters.prototype, {});

})();
