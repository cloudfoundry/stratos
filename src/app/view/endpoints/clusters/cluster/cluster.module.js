(function () {
  'use strict';

  angular
    .module('app.view.endpoints.cluster', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoints.cluster', {
      url: '/cluster/:guid',
      templateUrl: 'app/view/endpoints/clusters/cluster/cluster.html',
      controller: ClusterController,
      controllerAs: 'clusterController'
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
