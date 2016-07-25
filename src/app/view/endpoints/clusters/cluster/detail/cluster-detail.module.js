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
    'helion.framework.widgets.asyncTaskDialog'
  ];

  function ClusterDetailController(modelManager, $stateParams, $scope, utils, $state, $q, asyncTaskDialog) {
    var that = this;
    this.guid = $stateParams.guid;

    this.$scope = $scope;

    this.organizations = [];
    this.organizationNames = [];
    this.totalApps = 0;

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');

    this.clusterActions = [
      {
        name: gettext('Create Organization'),
        disabled: true,
        execute: function () {
          return asyncTaskDialog(
            {
              title: gettext('Create Organization'),
              templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/create-organization.html',
              buttonTitles: {
                submit: gettext('Create')
              }
            },
            {
              data: {
                // Make the form invalid if the name is already taken
                organizationNames: that.organizationNames
              }
            },
            function (orgData) {
              if (orgData.name && orgData.name.length > 0) {
                return organizationModel.createOrganization(that.guid, orgData.name);
              } else {
                return $q.reject('Invalid Name!');
              }

            }
          );
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

    function updateFromModel() {
      that.organizations.length = 0;
      _.forEach(organizationModel.organizations[that.guid], function (orgDetail) {
        that.organizations.push(orgDetail.details);
      });
      that.organizations.sort(function (o1, o2) { // Sort organizations by created date
        return o1.created_at - o2.created_at;
      });
      that.updateTotalApps();
      that.organizationNames = _.map(that.organizations, function (org) {
        return org.org.entity.name;
      });
    }

    /**
     * Enable actions based on admin status
     * N.B. when finer grain ACLs are wired in this should be updated
     * */
    function enableActions() {
      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      if (stackatoInfo.info.endpoints.hcf[that.guid].user.admin) {
        _.forEach(that.clusterActions, function (action) {
          action.disabled = false;
        });
        // Disable these until implemented!
        that.clusterActions[1].disabled = that.clusterActions[2].disabled = true;
      }
    }

    function init() {
      enableActions();

      // Start watching for further model changes after parent init chain completes
      $scope.$watchCollection(function () {
        return organizationModel.organizations[that.guid];
      }, function () {
        updateFromModel();
      });

      // init functions should return a promise
      return $q.resolve(that.organizations);
    }

    utils.chainStateResolve('endpoint.clusters.cluster.detail', $state, init);
  }

})();
