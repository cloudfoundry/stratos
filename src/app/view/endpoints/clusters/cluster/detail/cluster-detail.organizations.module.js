(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail.organizations', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.organizations', {
      url: '/organizations',
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail-organizations.html',
      controller: ClusterOrganizationsController,
      controllerAs: 'clusterOrganizationsController',
      ncyBreadcrumb: {
        label: gettext('Cluster'),
        parent: function () {
          return 'endpoint.clusters.tiles';
        }
      }
    });
  }

  ClusterOrganizationsController.$inject = [
    '$stateParams',
    'app.model.modelManager'
  ];

  function ClusterOrganizationsController($stateParams, modelManager) {
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.clusterGuid = $stateParams.guid;
  }

  angular.extend(ClusterOrganizationsController.prototype, {});
})();
