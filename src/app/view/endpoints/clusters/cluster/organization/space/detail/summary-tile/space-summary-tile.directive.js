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
    'app.view.notificationsService',
    'app.view.endpoints.clusters.cluster.cliCommands',
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
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {app.view.endpoints.clusters.cluster.cliCommands} cliCommands - service to show cli command slide out
   * @param {object} confirmDialog - our confirmation dialog service
   * @param {object} asyncTaskDialog - our async dialog service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function SpaceSummaryTileController($state, $scope, $stateParams, $q, modelManager, utils, notificationsService,
                                      cliCommands, confirmDialog, asyncTaskDialog) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;

    this.$state = $state;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.userServiceInstance = modelManager.retrieve('app.model.serviceInstance.user');

    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    var user = stackatoInfo.info.endpoints.hcf[this.clusterGuid].user;
    that.isAdmin = user.admin;
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    var spaceDetail;

    this.cardData = {
      title: gettext('Summary')
    };

    this.actions = [
      {
        name: gettext('Rename Space'),
        disabled: true,
        execute: function () {
          return asyncTaskDialog(
            {
              title: gettext('Rename Space'),
              templateUrl: 'app/view/endpoints/clusters/cluster/detail/actions/edit-space.html',
              buttonTitles: {
                submit: gettext('Save')
              },
              class: 'detail-view-thin'
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
                  {name: spaceData.name})
                  .then(function () {
                    notificationsService.notify('success', gettext('Space \'{{name}}\' successfully updated'),
                      {name: spaceData.name});
                  });
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
            },
            errorMessage: gettext('Failed to delete space'),
            callback: function () {
              return that.spaceModel.deleteSpace(that.clusterGuid, that.organizationGuid, that.spaceGuid)
                .then(function () {
                  notificationsService.notify('success', gettext('Space \'{{name}}\' successfully deleted'),
                    {name: that.spaceDetail().details.space.entity.name});
                  // After a successful delete, go up the breadcrumb tree (the current org no longer exists)
                  return $state.go($state.current.ncyBreadcrumb.parent());
                });
            }
          });
        }
      }
    ];

    this.getEndpoint = function () {
      return utils.getClusterEndpoint(that.userServiceInstance.serviceInstances[that.clusterGuid]);
    };

    this.showCliCommands = function () {
      cliCommands.show(this.getEndpoint(), this.userName,
        that.organizationModel.organizations[that.clusterGuid][that.organizationGuid].details.org.entity.name,
        that.spaceDetail().details.space.entity.name);
    };

    $scope.$watchCollection(function () {
      var space = that.spaceDetail();
      if (space && space.roles && space.roles[user.guid]) {
        return space.roles[user.guid];
      }
    }, function (roles) {
      // Present the user's roles
      that.roles = that.spaceModel.spaceRolesToStrings(roles);
    });

    function enableActions() {
      var canDelete = spaceDetail.details.totalRoutes === 0 &&
        spaceDetail.details.totalServiceInstances === 0 &&
        spaceDetail.details.totalApps === 0;

      // Rename Space
      that.actions[0].disabled = !authModel.isAllowed(that.clusterGuid, authModel.resources.space, authModel.actions.rename,
        spaceDetail.details.guid);

      // Delete Space
      that.actions[1].disabled = !canDelete || !authModel.isAllowed(that.clusterGuid, authModel.resources.space,
          authModel.actions.delete, spaceDetail.details.guid);

    }

    function init() {
      that.userName = user.name;
      spaceDetail = that.spaceDetail();
      that.memory = utils.sizeUtilization(spaceDetail.details.memUsed, spaceDetail.details.memQuota);

      // If navigating to/reloading the space details page these will be missing. Do these here instead of in
      // getSpaceDetails to avoid blocking state init when there are 100s of spaces
      var updatePromises = [];
      if (angular.isUndefined(spaceDetail.details.totalRoutes)) {
        updatePromises.push(that.spaceModel.updateRoutesCount(that.clusterGuid, that.spaceGuid));
      }
      if (angular.isUndefined(spaceDetail.details.totalServices)) {
        updatePromises.push(that.spaceModel.updateServiceCount(that.clusterGuid, that.spaceGuid));
      }

      return $q.all(updatePromises).then(function () {

        // Update delete action when space info changes (requires authService which depends on chainStateResolve)
        $scope.$watch(function () {
          return spaceDetail.details.totalRoutes === 0 &&
            spaceDetail.details.totalServiceInstances === 0 &&
            spaceDetail.details.totalApps === 0;
        }, function () {
          enableActions();
        });

        enableActions();
        return $q.resolve();
      });

    }

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail', $state, init);

  }

  angular.extend(SpaceSummaryTileController.prototype, {

    spaceDetail: function () {
      return this.spaceModel.fetchSpace(this.clusterGuid, this.spaceGuid);
    }

  });

})();
