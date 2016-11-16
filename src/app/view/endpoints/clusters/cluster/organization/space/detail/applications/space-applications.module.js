(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail.applications', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('clusters.cluster.organization.space.detail.applications', {
      url: '/applications',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/applications/space-applications.html',
      controller: SpaceApplicationsController,
      controllerAs: 'spaceAppsCtrl',
      ncyBreadcrumb: {
        label: '{{ clusterSpaceController.space().details.entity.name || "..." }}',
        parent: function () {
          return 'clusters.cluster.organization.detail.spaces';
        }
      }
    });
  }

  SpaceApplicationsController.$inject = [
    '$state',
    '$stateParams',
    '$q',
    '$scope',
    'app.model.modelManager',
    'app.utils.utilsService',
    'cloud-foundry.model.application.stateService'
  ];

  function SpaceApplicationsController($state, $stateParams, $q, $scope, modelManager, utils, appStateService) {
    var that = this;

    var clusterGuid = $stateParams.guid;
    var spaceGuid = $stateParams.space;

    function init() {
      // Collection can change if the space is renamed
      $scope.$watch(function () {
        return that.spaceDetail().apps;
      }, function (apps) {
        _.forEach(apps, function (application) {
          application.state = appStateService.get(application.entity);
          var theMoment = moment(application.metadata.created_at);
          application.invertedCreatedTimestamp = -theMoment.unix();
          application.createdTimestampString = theMoment.format('L - LTS');
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

    utils.chainStateResolve('clusters.cluster.organization.space.detail.applications', $state, init);
  }
})();
