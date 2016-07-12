(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail', [
      'app.view.endpoints.clusters.cluster.detail.organizations',
      'app.view.endpoints.clusters.cluster.detail.users'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    console.log('Registering endpoint.clusters.cluster.detail');
    $stateProvider.state('endpoint.clusters.cluster.detail', {
      url: '',
      abstract: true,
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail.html',
      controller: ClusterDetailController,
      controllerAs: 'clusterController'
    });
  }

  ClusterDetailController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    '$scope',
    'app.utils.utilsService'
  ];

  function ClusterDetailController(modelManager, $stateParams, $scope, utils) {
    var that = this;
    this.guid = $stateParams.guid;

    this.$scope = $scope;
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.organizations = [];
    this.totalApps = 0;

    // Get the cluster info
    this.cluster = {
      name: '',
      api_endpoint: ''
    };

    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.cnsiModel.list().then(function (registeredInstances) {
      that.cluster = registeredInstances[that.guid];
    });

    this.clusterActions = [
      {
        name: gettext('Create Organization'),
        disabled: true,
        execute: function () {
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Tree'
      },
      {
        name: gettext('Create Space'),
        disabled: true,
        execute: function () {
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Tree'
      },
      {
        name: gettext('Assign User(s)'),
        disabled: true,
        execute: function () {
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Add_user'
      }
    ];

    this.updateTotalApps = function () {
      that.totalApps = 0;
      var totalMemoryMb = 0;
      _.forEach(that.organizationModel.organizations[that.guid], function (org) {
        that.totalApps += org.total_apps;
        totalMemoryMb += org.mem_used;
      });
      that.totalMemoryUsed = utils.mbToHumanSize(totalMemoryMb);
    };

    this.organizationModel.listAllOrganizations(this.guid, {}).then(function (orgs) {
      that.organizations = [];
      _.forEach(orgs, function (org) {
        that.organizationModel.getOrganizationDetails(that.guid, org).then(function (orgDetails) {
          _.set(orgDetails, 'metadata.guid', org.metadata.guid);
          that.organizations.push(orgDetails);

          that.updateTotalApps();

          // Sort orgs by created date
          that.organizations.sort(function (o1, o2) {
            return o1.created_at - o2.created_at;
          });
        });

      });
    });

  }

  angular.extend(ClusterDetailController.prototype, {});
})();
