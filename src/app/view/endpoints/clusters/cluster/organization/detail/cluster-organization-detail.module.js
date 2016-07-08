(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail', {
      url: '',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/cluster-organization-detail.html',
      controller: ClusterOrgController,
      controllerAs: 'clusterController'
    });
  }

  ClusterOrgController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterOrgController(modelManager, $stateParams) {
    this.guid = $stateParams.guid;
    this.organization = $stateParams.organization;
  }

  angular.extend(ClusterOrgController.prototype, {});
})();
