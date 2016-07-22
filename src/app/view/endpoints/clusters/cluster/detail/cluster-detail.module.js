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
      controllerAs: 'clusterDetailController'
    });
  }

  ClusterDetailController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    '$scope',
    '$q',
    'app.utils.utilsService',
    '$state',
    'app.view.endpoints.clusters.cluster.assignUsers'
  ];

  function ClusterDetailController(modelManager, $stateParams, $scope, $q, utils, $state, assignUsers) {
    var that = this;
    this.guid = $stateParams.guid;

    this.$scope = $scope;

    this.organizations = [];
    this.totalApps = 0;
    this.selectedUsers = {};

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');

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
        execute: function () {
          assignUsers.assign(initDefered.promise, that.guid, null, null, that.selectedUsers);
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Add_user'
      }
    ];

    this.updateTotalApps = function () {
      that.totalApps = 0;
      var totalMemoryMb = 0;
      _.forEach(that.organizations, function (orgDetails) {
        that.totalApps += orgDetails.totalApps;
        totalMemoryMb += orgDetails.memUsed;
      });
      that.totalMemoryUsed = utils.mbToHumanSize(totalMemoryMb);
    };

    var initDefered = $q.defer();
    function init() {
      that.organizations = [];
      _.forEach(organizationModel.organizations[that.guid], function (orgDetail) {
        that.organizations.push(orgDetail.details);

        that.updateTotalApps();

        // Sort organizations by created date
        that.organizations.sort(function (o1, o2) {
          return o1.created_at - o2.created_at;
        });
      });
      initDefered.resolve();
      console.log('init');
    }
    utils.chainStateResolve('endpoint.clusters.cluster.detail', $state, init);
  }

})();
