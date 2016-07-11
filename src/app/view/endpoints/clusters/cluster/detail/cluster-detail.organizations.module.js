(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail.organizations', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    console.log('Registering route endpoint.clusters.cluster.detail.organizations');
    $stateProvider.state('endpoint.clusters.cluster.detail.organizations', {
      url: '/organizations',
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail-organizations.html',
      controller: ClusterOrganizationsController,
      controllerAs: 'clusterOrganizationsController'
    });
  }

  ClusterOrganizationsController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterOrganizationsController(modelManager, $stateParams) {
    var that = this;
    this.guid = $stateParams.guid;

    this.orgs = undefined;
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.organizationModel.listAllOrganizations(this.guid, {}).then(function (orgs) {
      that.organizations = [];
      // console.log('Received list of Orgs: ', orgs);
      _.forEach(orgs, function (org) {
        var promiseForDetails = that.organizationModel.getOrganizationDetails(that.guid, org).then(function (orgDetails) {
          that.organizations.push(orgDetails);
          // console.log('that.organizations', JSON.stringify(that.organizations));
        });

      });
    });

    this.foo = function () {
      console.log('FOO!');
    };
  }

  angular.extend(ClusterOrganizationsController.prototype, {});
})();
