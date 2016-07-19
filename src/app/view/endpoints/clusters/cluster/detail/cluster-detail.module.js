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
      controllerAs: 'clusterController',
      data: {}
    });
  }

  ClusterDetailController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    '$state',
    '$scope',
    '$q',
    '$log',
    'app.utils.utilsService'
  ];

  function ClusterDetailController(modelManager, $stateParams, $state, $scope, $q, $log, utils) {
    var that = this;
    this.guid = $stateParams.guid;

    this.$scope = $scope;
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');

    // TODO: use model cache instead
    this.organizations = [];
    this.totalApps = 0;

    // Get the cluster info
    this.cluster = {
      name: '',
      api_endpoint: ''
    };

    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance.user');

    function init() {
      var listCnsisP = that.cnsiModel.list().then(function (registeredInstances) {
        that.cluster = registeredInstances[that.guid];
      });

      var listOrgsDetailsP = that.organizationModel.listAllOrganizations(that.guid, {}).then(function (orgs) {
        that.organizations = [];
        that.updateTotalApps();
        var promises = [];
        _.forEach(orgs, function (org) {
          var promise = that.organizationModel.getOrganizationDetails(that.guid, org).then(function (orgDetails) {
            that.organizations.push(orgDetails);

            that.updateTotalApps();

            // Sort organizations by created date
            that.organizations.sort(function (o1, o2) {
              return o1.created_at - o2.created_at;
            });
          });
          promises.push(promise);
        });
        return $q.all(promises);
      }).catch(function (error) {
        $log.error('Error while listing organizations', error);
      });

      return $q.all([listCnsisP, listOrgsDetailsP]).then(function () {
        $log.debug('ClusterUsersController finished init');
      });
    }

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
      _.forEach(that.organizations, function (orgDetails) {
        that.totalApps += orgDetails.totalApps;
        totalMemoryMb += orgDetails.memUsed;
      });
      that.totalMemoryUsed = utils.mbToHumanSize(totalMemoryMb);
    };

    utils.chainStateResolve($state, init);

  }

})();
