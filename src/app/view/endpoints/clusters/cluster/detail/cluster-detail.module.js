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

    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

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
        that.totalApps += org.totalApps;
        totalMemoryMb += org.memUsed;
      });
      that.totalMemoryUsed = utils.mbToHumanSize(totalMemoryMb);
    };

    $scope.$watch(function () { return _.get(that.organizationModel, 'organizations.' + that.guid); }, function (orgDetails) {
      if (!orgDetails) {
        return;
      }
      that.organizations = [];
      _.forEach(orgDetails, function (orgDetail) {
        that.organizations.push(orgDetail);

        that.updateTotalApps();

        // Sort organizations by created date
        that.organizations.sort(function (o1, o2) {
          return o1.created_at - o2.created_at;
        });
      });
    });

    // this.organizationModel.listAllOrganizations(this.guid, {}).then(function (orgs) {
    //   that.organizations = [];
    //   that.updateTotalApps();
    //   _.forEach(orgs, function (org) {
    //     that.organizationModel.getOrganizationDetails(that.guid, org).then(function (orgDetails) {
    //       that.organizations.push(orgDetails);
    //
    //       that.updateTotalApps();
    //
    //       // Sort organizations by created date
    //       that.organizations.sort(function (o1, o2) {
    //         return o1.created_at - o2.created_at;
    //       });
    //     });
    //
    //   });
    // }).catch(function (error) {
    //   $log.error('Error while listing organizations', error);
    // });

  }

  angular.extend(ClusterDetailController.prototype, {});
})();
