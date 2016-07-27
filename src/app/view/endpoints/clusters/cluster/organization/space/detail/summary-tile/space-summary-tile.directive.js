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
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    var user = stackatoInfo.info.endpoints.hcf[this.clusterGuid].user;

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

    $scope.$watchCollection(function () {
      return _.get(that.spaceModel, that.spacePath + '.roles.' + user.guid);
    }, function (roles) {
      // Present the user's roles
      that.roles = that.spaceModel.spaceRolesToString(roles);
    });
  }

  angular.extend(SpaceSummaryTileController.prototype, {

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });

})();
