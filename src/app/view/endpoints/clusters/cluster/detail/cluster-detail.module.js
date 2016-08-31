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
    'app.utils.utilsService',
    '$state',
    '$q',
    'app.view.endpoints.clusters.cluster.cliCommands'
  ];

  function ClusterDetailController(modelManager, $stateParams, $scope, utils, $state, $q, cliCommands) {
    var that = this;
    this.guid = $stateParams.guid;
    this.cliCommands = cliCommands;

    this.$scope = $scope;

    this.totalApps = 0;

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');

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

    function init() {
      that.organizations = [];

      var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      var user = stackatoInfo.info.endpoints.hcf[that.guid].user;
      that.isAdmin = user.admin;
      that.userName = user.name;
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
  }

})();
