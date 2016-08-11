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
    '$scope',
    '$stateParams',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'helion.framework.widgets.dialog.confirm',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name SpaceSummaryTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @param {object} $scope - the angular $scope service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $q - the angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.model.utilsService} utils - the utils service
   * @param {object} confirmDialog - our confirmation dialog service
   * @param {object} asyncTaskDialog - our async dialog service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function SpaceSummaryTileController($state, $scope, $stateParams, $q,
                                      modelManager, utils, confirmDialog, asyncTaskDialog) {
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
          return asyncTaskDialog(
            {
              title: gettext('Edit Space'),
              templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/edit-space.html',
              buttonTitles: {
                submit: gettext('Save')
              }
            },
            {
              data: {
                name: that.spaceDetail().details.space.entity.name,
                spaceNames: _.map(that.organizationModel.organizations[that.clusterGuid][that.organizationGuid].spaces, function (space) {
                  return space.entity.name;
                })
              }
            },
            function (spaceData) {
              if (spaceData.name && spaceData.name.length > 0) {
                return that.spaceModel.updateSpace(that.clusterGuid, that.organizationGuid, that.spaceGuid,
                  {name: spaceData.name});
              } else {
                return $q.reject('Invalid Name!');
              }
            }
          );
        }
      },
      {
        name: gettext('Delete Space'),
        disabled: true,
        execute: function () {
          return confirmDialog({
            title: gettext('Delete Space'),
            description: gettext('Are you sure you want to delete space') +
            " '" + that.spaceDetail().details.space.entity.name + "'?",
            buttonText: {
              yes: gettext('Delete'),
              no: gettext('Cancel')
            }
          }).result.then(function () {
            return that.spaceModel.deleteSpace(that.clusterGuid, that.organizationGuid, that.spaceGuid).then(function () {
              // After a successful delete, go up the breadcrumb tree (the current org no longer exists)
              return $state.go($state.current.ncyBreadcrumb.parent());
            });
          });
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
      that.roles = that.spaceModel.spaceRolesToStrings(roles);
    });

    function init() {
      var canDelete = false;
      that.isAdmin = user.admin;
      that.userName = user.name;
      var spaceDetail = that.spaceDetail();
      if (that.isAdmin) {
        canDelete = spaceDetail.routes.length === 0 &&
          spaceDetail.instances.length === 0 &&
          spaceDetail.apps.length === 0 &&
          spaceDetail.services.length === 0;
      }
      that.actions[0].disabled = !that.isAdmin;
      that.actions[1].disabled = !canDelete;

      that.memory = utils.sizeUtilization(spaceDetail.details.memUsed, spaceDetail.details.memQuota);

      return $q.resolve();
    }

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail', $state, init);

  }

  angular.extend(SpaceSummaryTileController.prototype, {

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });

})();
