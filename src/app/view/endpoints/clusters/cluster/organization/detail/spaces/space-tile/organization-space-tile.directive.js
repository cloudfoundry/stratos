(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space')
    .directive('organizationSpaceTile', OrganizationSpaceTile);

  OrganizationSpaceTile.$inject = [];

  function OrganizationSpaceTile() {
    return {
      bindToController: {
        space: '='
      },
      controller: OrganizationSpaceTileController,
      controllerAs: 'orgSpaceTileCtrl',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/spaces/space-tile/organization-space-tile.html'
    };
  }

  OrganizationSpaceTileController.$inject = [
    '$state',
    '$stateParams',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.view.endpoints.clusters.cluster.assignUsers',
    'app.view.notificationsService',
    'app.utils.utilsService',
    'helion.framework.widgets.dialog.confirm',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name OrganizationSpaceTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $scope - the angular $scope service
   * @param {object} $q - the angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.view.endpoints.clusters.cluster.assignUsers} assignUsers - our assign users slide out service
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {object} utils - our utils service
   * @param {object} confirmDialog - our confirmation dialog service
   * @param {object} asyncTaskDialog - our async dialog service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationSpaceTileController($state, $stateParams, $scope, $q, modelManager, assignUsers,
                                           notificationsService, utils, confirmDialog, asyncTaskDialog) {
    var that = this;

    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.$state = $state;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = this.space.metadata.guid;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.user = stackatoInfo.info.endpoints.hcf[this.clusterGuid].user;
    var isAdmin = this.user.admin;
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var destroyed = false;
    $scope.$on('$destroy', function () {
      destroyed = true;
    });

    function init() {
      if (destroyed) {
        return $q.resolve();
      }

      var spaceDetail = that.spaceDetail();

      that.memory = utils.sizeUtilization(spaceDetail.details.memUsed, spaceDetail.details.memQuota);

      // Update these counts per tile, meaning the core getSpaceDetails does not block in the case of 100s of
      // spaces but instead shows list and updates when async data returns
      var updatePromises = [];
      if (angular.isUndefined(spaceDetail.details.totalRoutes)) {
        updatePromises.push(that.spaceModel.updateRoutesCount(that.clusterGuid, that.spaceGuid));
      }
      if (angular.isUndefined(spaceDetail.details.totalServiceInstances)) {
        updatePromises.push(that.spaceModel.updateServiceInstanceCount(that.clusterGuid, that.spaceGuid));
      }

      return $q.all(updatePromises).then(function () {

        that.canDelete = spaceDetail.details.totalRoutes === 0 &&
          spaceDetail.details.totalServiceInstances === 0 &&
          spaceDetail.details.totalApps === 0;

        enableActions();

        return $q.resolve();
      });

    }

    var cardData = {};
    cardData.title = this.space.entity.name;
    this.cardData = function () {
      return cardData;
    };

    var renameAction = {
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
              if (that.spaceDetail().details.space.entity.name === spaceData.name) {
                return $q.resolve();
              }
              return that.spaceModel.updateSpace(that.clusterGuid, that.organizationGuid, that.spaceGuid,
                {name: spaceData.name})
                .then(function () {
                  notificationsService.notify('success', gettext('Space \'{{name}}\' successfully updated'),
                    {name: spaceData.name});
                  cardData.title = spaceData.name;
                });
            } else {
              return $q.reject('Invalid Name!');
            }
          }
        );
      }
    };
    var deleteAction = {
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
              });
          }
        });
      }
    };
    var assignAction = {
      name: gettext('Assign User(s)'),
      disabled: true,
      execute: function () {
        assignUsers.assign({
          clusterGuid: that.clusterGuid,
          organizationGuid: that.organizationGuid,
          spaceGuid: that.spaceGuid
        });
      }
    };

    function enableActions() {
      that.actions = [ ];

      // Rename Space
      var canRename = authModel.isAllowed(that.clusterGuid, authModel.resources.space, authModel.actions.rename,
        that.spaceDetail().details.guid, that.organizationGuid);
      if (canRename || isAdmin) {
        renameAction.disabled = false;
        that.actions.push(renameAction);
      }

      // Delete Space
      var canDelete = authModel.isAllowed(that.clusterGuid, authModel.resources.space, authModel.actions.delete,
        that.organizationGuid);
      if (canDelete || isAdmin) {
        deleteAction.disabled = !that.canDelete;
        that.actions.push(deleteAction);
      }

      // User Assignment
      var canAssign = authModel.isOrgOrSpaceActionableByResource(that.clusterGuid,
          that.organizationModel.organizations[that.clusterGuid][that.organizationGuid],
          authModel.actions.update);
      if (canAssign || isAdmin) {
        assignAction.disabled = false;
        that.actions.push(assignAction);
      }

      if (that.actions.length < 1) {
        delete that.actions;
      }
    }

    $scope.$watchCollection(function () {
      var space = that.spaceDetail();
      if (space && space.roles && space.roles[that.user.guid]) {
        return space.roles[that.user.guid];
      }
    }, function (roles) {
      // Present the user's roles
      that.roles = that.spaceModel.spaceRolesToStrings(roles);
    });

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('clusters.cluster.organization.detail.spaces', $state, init);

  }

  angular.extend(OrganizationSpaceTileController.prototype, {

    summary: function () {
      this.$state.go('clusters.cluster.organization.space.detail.applications', {space: this.space.metadata.guid});
    },

    spaceDetail: function () {
      return this.spaceModel.fetchSpace(this.clusterGuid, this.spaceGuid);
    },

    orgDetails: function () {
      return this.organizationModel.fetchOrganization(this.clusterGuid, this.organizationGuid);
    }

  });

})();
