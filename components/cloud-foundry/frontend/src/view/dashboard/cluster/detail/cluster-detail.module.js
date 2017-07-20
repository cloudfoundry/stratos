(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.detail', [
      'cloud-foundry.view.dashboard.cluster.detail.organizations',
      'cloud-foundry.view.dashboard.cluster.detail.users',
      'cloud-foundry.view.dashboard.cluster.detail.firehose',
      'cloud-foundry.view.dashboard.cluster.detail.featureFlags',
      'cloud-foundry.view.dashboard.cluster.detail.buildPacks',
      'cloud-foundry.view.dashboard.cluster.detail.stacks',
      'cloud-foundry.view.dashboard.cluster.detail.securityGroups'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail', {
      url: '',
      abstract: true,
      params: {
        userCount: undefined,
        orgCount: undefined
      },
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/cluster-detail.html',
      controller: ClusterDetailController,
      controllerAs: 'clusterDetailController'
    });
  }

  function ClusterDetailController($stateParams, $scope, $state, $q,
                                   modelManager, apiManager, appUtilsService, appClusterCliCommands,
                                   modelUtils, cfOrganizationModel, cfUtilsService, cfTabs) {
    var that = this;
    this.guid = $stateParams.guid;
    this.appClusterCliCommands = appClusterCliCommands;

    this.$scope = $scope;

    this.totalApps = 0;
    this.userCount = $stateParams.userCount;
    this.orgCount = $stateParams.orgCount;
    this.service = {};
    this.userService = {};
    this.cfTabs = cfTabs;

    var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var userApi = apiManager.retrieve('cloud-foundry.api.Users');
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
    var organizationApi = apiManager.retrieve('cloud-foundry.api.Organizations');

    this.updateTotalApps = function () {
      that.totalApps = 0;
      var totalMemoryMb = 0;
      _.forEach(that.organizations, function (orgDetails) {
        that.totalApps += orgDetails.totalApps;
        totalMemoryMb += orgDetails.memUsed;
      });
      that.totalMemoryUsed = appUtilsService.mbToHumanSize(totalMemoryMb);
    };

    function updateFromModel() {
      that.organizations.length = 0;
      _.forEach(cfOrganizationModel.organizations[that.guid], function (orgDetail) {
        that.organizations.push(orgDetail.details);
      });
      that.organizations.sort(function (o1, o2) { // Sort organizations by created date
        return o1.created_at - o2.created_at;
      });
      that.updateTotalApps();
    }

    this.showCliCommands = function () {
      appClusterCliCommands.show(appUtilsService.getClusterEndpoint(that.userService), this.userName, that.guid);
    };

    function init() {
      that.organizations = [];

      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      var user = consoleInfo.info.endpoints.cf[that.guid].user;
      that.userService = userServiceInstanceModel.serviceInstances[that.guid] || {};
      that.service = _.find(serviceInstanceModel.serviceInstances, {guid: that.guid});
      that.isAdmin = user.admin;
      that.userName = user.name;
      // Save requests if user is coming from the Cluster Tiles page
      if (update(that.userCount) || update(that.orgCount)) {
        setUserCount();
        setOrganisationCount();
      }
      // Start watching for further model changes after parent init chain completes
      $scope.$watchCollection(function () {
        return cfOrganizationModel.organizations[that.guid];
      }, function () {
        updateFromModel();
      });

      that.sshAccess = cfUtilsService.hasSshAccess(that.userService);

      that.initialized = true;

      // init functions should return a promise
      return $q.resolve(that.organizations);
    }

    appUtilsService.chainStateResolve('endpoint.clusters.cluster.detail', $state, init);

    function update(value) {
      // Can be `0` if user quickly navigates from the Clusters tile page
      return _.isUndefined(value) || _.isNull(value) || value === 0;
    }

    function setUserCount() {
      that.userCount = 0;

      if (!that.userService.valid || that.userService.error || !consoleInfo.info.endpoints.cf[that.guid].user.admin) {
        that.userCount = undefined;
        return;
      }

      userApi.ListAllUsers({'results-per-page': 1},
        modelUtils.makeHttpConfig(that.guid))
        .then(function (response) {
          that.userCount = response.data.total_results;
        })
        .catch(function () {
          that.userCount = undefined;
        });
    }

    function setOrganisationCount() {
      that.orgCount = 0;

      if (!that.userService.valid || that.userService.error) {
        that.orgCount = undefined;
        return;
      }
      organizationApi.ListAllOrganizations({'results-per-page': 1},
        modelUtils.makeHttpConfig(that.guid))
        .then(function (response) {
          that.orgCount = response.data.total_results;
        })
        .catch(function () {
          that.orgCount = undefined;
        });
    }

  }

})();
