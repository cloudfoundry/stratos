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
    var that = this;
    this.guid = $stateParams.guid;

    this.clusterName = 'TODO: get cluster name';

    this.orgs = undefined;
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.organizationModel.listAllOrganizations(this.guid, {}).then(function (orgs) {
      that.organizations = [];
      console.log('Received list of Orgs: ', orgs);
      _.forEach(orgs, function (org) {
        var promiseForDetails = that.organizationModel.getOrganizationDetails(that.guid, org).then(function (orgDetails) {
          that.organizations.push(orgDetails);
          console.log('that.organizations', JSON.stringify(that.organizations));
        });

      });
    });

    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.usersModel.listAllUsers(this.guid, {}).then(function (res) {
      console.log('Received list of Users: ', res);
    });

    this.foo = function () {
      console.log('FOO!');
    };
  }

  angular.extend(ClusterDetailController.prototype, {});
})();
