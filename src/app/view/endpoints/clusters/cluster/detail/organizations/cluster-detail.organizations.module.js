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
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/organizations/cluster-detail-organizations.html',
      controller: ClusterOrganizationsController,
      controllerAs: 'clusterOrganizationsController',
      ncyBreadcrumb: {
        label: '{{ clusterController.userServiceInstanceModel.serviceInstances[clusterController.guid].name ||"..." }}',
        parent: function () {
          return 'endpoint.clusters.tiles';
        }
      }
    });
  }

  ClusterOrganizationsController.$inject = [
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function ClusterOrganizationsController($state, $stateParams, modelManager, utils) {

    this.stateName = $state.current.name;
    this.authService = modelManager.retrieve('cloud-foundry.model.auth');
    this.clusterGuid = $stateParams.guid;
    this.utils = utils;

    var that = this;

    function init() {
      return that.authService.initAuthService(that.clusterGuid);
    }

    utils.chainStateResolve(this.stateName, $state, init);

  }

})();
