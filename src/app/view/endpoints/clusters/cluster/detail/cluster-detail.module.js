(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail', [
      'app.view.endpoints.clusters.cluster.detail.organizations',
      'app.view.endpoints.clusters.cluster.detail.users',
      'app.view.endpoints.clusters.cluster.detail.firehose'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail', {
      url: '',
      abstract: true,
      params: {
        userCount: undefined,
        orgCount: undefined
      },
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail.html',
      controller: ClusterDetailController,
      controllerAs: 'clusterDetailController'
    });
  }

  ClusterDetailController.$inject = [
    '$stateParams',
    '$scope',
    '$state',
    '$q',
    'app.model.modelManager',
    'app.api.apiManager',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.cluster.cliCommands',
    'cloud-foundry.model.modelUtils',
    'organization-model'
  ];

  function ClusterDetailController($stateParams, $scope, $state, $q,
                                   modelManager, apiManager, utils, cliCommands, modelUtils, organizationModel) {
    var that = this;
    this.guid = $stateParams.guid;
    this.cliCommands = cliCommands;

    this.$scope = $scope;

    this.totalApps = 0;
    this.userCount = $stateParams.userCount;
    this.orgCount = $stateParams.orgCount;
    this.service = {};
    this.userService = {};
    var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var userApi = apiManager.retrieve('cloud-foundry.api.Users');
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    var organizationApi = apiManager.retrieve('cloud-foundry.api.Organizations');

    this.updateTotalApps = function () {
      that.totalApps = 0;
      var totalMemoryMb = 0;
      _.forEach(that.organizations, function (orgDetails) {
        that.totalApps += orgDetails.totalApps;
        totalMemoryMb += orgDetails.memUsed;
      });
      that.totalMemoryUsed = utils.mbToHumanSize(totalMemoryMb);
    };

    function updateFromModel() {
      that.organizations.length = 0;
      _.forEach(organizationModel.organizations[that.guid], function (orgDetail) {
        that.organizations.push(orgDetail.details);
      });
      that.organizations.sort(function (o1, o2) { // Sort organizations by created date
        return o1.created_at - o2.created_at;
      });
      that.updateTotalApps();
    }

    this.showCliCommands = function () {
      cliCommands.show(utils.getClusterEndpoint(that.userService), this.userName, that.guid);
    };

    function init() {
      that.organizations = [];

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      var user = stackatoInfo.info.endpoints.hcf[that.guid].user;
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
        return organizationModel.organizations[that.guid];
      }, function () {
        updateFromModel();
      });

      that.initialized = true;

      // init functions should return a promise
      return $q.resolve(that.organizations);
    }

    utils.chainStateResolve('endpoint.clusters.cluster.detail', $state, init);

    function update(value) {
      // Can be `0` if user quickly navigates from the Clusters tile page
      return _.isUndefined(value) || _.isNull(value) || value === 0;
    }

    function setUserCount() {
      that.userCount = 0;

      if (!that.userService.valid || that.userService.error || !stackatoInfo.info.endpoints.hcf[that.guid].user.admin) {
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
