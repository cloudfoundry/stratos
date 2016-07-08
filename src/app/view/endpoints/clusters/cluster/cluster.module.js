(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster', [
      'app.view.endpoints.clusters.cluster.detail',
      'app.view.endpoints.clusters.cluster.organization'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster', {
      url: '/:guid',
      abstract: true,
      template: '<ui-view/>'
    });
  }

  ClusterController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterController(modelManager, $stateParams) {
    this.guid = $stateParams.guid;
  }

  angular.extend(ClusterController.prototype, {});
})();
