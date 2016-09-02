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
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.orgPath = this.organizationModel.fetchOrganizationPath(this.clusterGuid, this.organizationGuid);
    this.user = stackatoInfo.info.endpoints.hcf[this.clusterGuid].user;
    var authService = modelManager.retrieve('cloud-foundry.model.auth');

    function init() {

      var spaceDetail = that.spaceDetail();
      that.canDelete = spaceDetail.routes.length === 0 &&
        spaceDetail.instances.length === 0 &&
        spaceDetail.apps.length === 0 &&
        spaceDetail.services.length === 0;

      that.memory = utils.sizeUtilization(spaceDetail.details.memUsed, spaceDetail.details.memQuota);
      enableActions();
      return $q.resolve();
    }

    function enableActions() {

      // Rename Space
      that.actions[0].disabled = !authService.isAllowed(that.clusterGuid, authService.resources.space, authService.actions.rename, that.spaceDetail().details.space.metadata.guid);

      // Delete Space
      that.actions[1].disabled = !that.canDelete || !authService.isAllowed(that.clusterGuid, authService.resources.space, authService.actions.delete, that.spaceDetail().details.space.metadata.guid);

      // User Assignment
      that.actions[2].disabled = authService.principal[that.clusterGuid].userSummary.organizations.managed.length === 0 &&
        authService.principal[that.clusterGuid].userSummary.spaces.managed.length === 0;

    }

    var cardData = {};
    cardData.title = this.space.entity.name;
    this.cardData = function () {
      return cardData;
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
                });
            }
          });
        }
      },
      {
        name: gettext('Assign User(s)'),
        disabled: true,
        execute: function () {
          assignUsers.assign({
            clusterGuid: that.clusterGuid,
            organizationGuid: that.organizationGuid,
            spaceGuid: that.spaceGuid
          });
        }
      }
    ];

    $scope.$watchCollection(function () {
      return _.get(that.spaceModel, that.spacePath + '.roles.' + that.user.guid);
    }, function (roles) {
      // Present the user's roles
      that.roles = that.spaceModel.spaceRolesToStrings(roles);
    });

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.detail.spaces', $state, init);

  }

  angular.extend(OrganizationSpaceTileController.prototype, {

    summary: function () {
      this.$state.go('endpoint.clusters.cluster.organization.space.detail.services', {space: this.space.metadata.guid});
    },

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    },

    orgDetails: function () {
      return _.get(this.organizationModel, this.orgPath);
    }

  });

})();
