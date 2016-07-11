(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail', {
      url: '',
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail.html',
      controller: ClusterDetailController,
      controllerAs: 'clusterController'
    });
  }

  ClusterDetailController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterDetailController(modelManager, $stateParams) {
    this.guid = $stateParams.guid;
  }

  angular.extend(ClusterDetailController.prototype, {});
})();
