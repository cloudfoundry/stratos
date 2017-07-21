(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.space.detail.applications', [])
    .config(registerRoute)
    .run(registerTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail.applications', {
      url: '/applications',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/space/detail/applications/space-applications.html',
      controller: SpaceApplicationsController,
      controllerAs: 'spaceAppsCtrl',
      ncyBreadcrumb: {
        label: '{{ clusterSpaceController.space().details.space.entity.name || "..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.organization.detail.spaces';
        }
      }
    });
  }

  function registerTab(cfTabs) {
    cfTabs.spaceTabs.push({
      position: 1,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.organization.space.detail.applications',
      uiSrefParam: _.noop,
      label: 'cf.space-info.tabs.applications.title'
    });
  }

  function SpaceApplicationsController($state, $stateParams, $q, $scope, $filter,
                                       modelManager, appUtilsService, cfAppStateService) {
    var that = this;

    var clusterGuid = $stateParams.guid;
    var spaceGuid = $stateParams.space;

    function init() {
      // Collection can change if the space is renamed
      $scope.$watch(function () {
        return that.spaceDetail().apps;
      }, function (apps) {
        _.forEach(apps, function (application) {
          application.state = cfAppStateService.get(application.entity);
          var theMoment = moment(application.metadata.created_at);
          application.invertedCreatedTimestamp = -theMoment.unix();
          application.createdTimestampString = $filter('momentDateFormat')(theMoment);
        });
      });

      return $q.resolve();
    }

    function _getSpaceModel() {
      return modelManager.retrieve('cloud-foundry.model.space');
    }

    this.spaceDetail = function () {
      return _getSpaceModel().fetchSpace(clusterGuid, spaceGuid);
    };

    this.goToApp = function (application) {
      $state.go('cf.applications.application.summary', {
        cnsiGuid: clusterGuid,
        guid: application.metadata.guid
      });
    };

    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.applications', $state, init);
  }
})();
