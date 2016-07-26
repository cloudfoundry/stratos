(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail')
    .directive('spaceSummaryTile', SpaceSummaryTile);

  SpaceSummaryTile.$inject = [];

  function SpaceSummaryTile() {
    return {
      bindToController: {
        space: '='
      },
      controller: SpaceSummaryTileController,
      controllerAs: 'spaceSummaryTileCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/summary-tile/space-summary-tile.html'
    };
  }

  SpaceSummaryTileController.$inject = [
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService',
    '$scope',
    '$stateParams'
  ];

  /**
   * @name SpaceSummaryTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.model.utilsService} utils - the utils service
   * @param {object} $scope - the angular $scope service
   * @param {object} $stateParams - the angular $stateParams service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function SpaceSummaryTileController($state, modelManager, utils, $scope, $stateParams) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;

    this.$state = $state;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.userServiceInstance = modelManager.retrieve('app.model.serviceInstance.user');

    this.cardData = {
      title: gettext('Summary')
    };

    this.actions = [
      {
        name: gettext('Edit Space'),
        disabled: true,
        execute: function () {
        }
      },
      {
        name: gettext('Delete Space'),
        disabled: true,
        execute: function () {
        }
      }
    ];

    this.getEndpoint = function () {
      return utils.getClusterEndpoint(that.userServiceInstance.serviceInstances[that.clusterGuid]);
    };

    $scope.$watch(function () {
      return that.spaceDetail().details;
    }, function (spaceDetail) {
      if (!spaceDetail) {
        return;
      }

      // Present memory usage
      // var usedMemHuman = that.utils.mbToHumanSize(orgDetail.memUsed);
      // var memQuotaHuman = that.utils.mbToHumanSize(orgDetail.memQuota);
      // that.memory = usedMemHuman + ' / ' + memQuotaHuman;

      // Present the user's roles
      that.roles = that.spaceModel.spaceRolesToString(spaceDetail.roles);
    });
  }

  angular.extend(SpaceSummaryTileController.prototype, {

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });

})();
