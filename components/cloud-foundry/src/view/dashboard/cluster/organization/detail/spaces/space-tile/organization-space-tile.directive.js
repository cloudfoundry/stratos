(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.space')
    .directive('organizationSpaceTile', OrganizationSpaceTile);

  function OrganizationSpaceTile() {
    return {
      bindToController: {
        space: '='
      },
      controller: OrganizationSpaceTileController,
      controllerAs: 'orgSpaceTileCtrl',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/detail/spaces/space-tile/organization-space-tile.html'
    };
  }

  /**
   * @name OrganizationSpaceTileController
   * @constructor
   * @param {object} $state - the angular $state service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $scope - the angular $scope service
   * @param {object} $q - the angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {appClusterAssignUsers} appClusterAssignUsers - our assign users slide out service
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {object} appUtilsService - our appUtilsService service
   * @param {object} frameworkDialogConfirm - our confirmation dialog service
   * @param {object} frameworkAsyncTaskDialog - our async dialog service
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   */
  function OrganizationSpaceTileController($state, $stateParams, $scope, $q, modelManager, appClusterAssignUsers,
                                           appNotificationsService, appUtilsService, frameworkDialogConfirm,
                                           frameworkAsyncTaskDialog, cfOrganizationModel) {
    var vm = this;

    vm.clusterGuid = $stateParams.guid;
    vm.organizationGuid = $stateParams.organization;
    vm.spaceGuid = vm.space.metadata.guid;
    vm.roles = null;
    vm.memory = null;
    vm.actions = [];
    vm.summary = summary;
    vm.spaceDetail = spaceDetail;
    vm.cardData = cardData;

    var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var user = consoleInfo.info.endpoints.cf[vm.clusterGuid].user;
    var isAdmin = user.admin;
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var destroyed = false;
    $scope.$on('$destroy', function () {
      destroyed = true;
    });

    var cardDataObj = {};
    cardDataObj.title = vm.space.entity.name;

    var renameAction = {
      name: gettext('Rename Space'),
      disabled: true,
      execute: function () {
        return frameworkAsyncTaskDialog(
          {
            title: gettext('Rename Space'),
            templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/actions/edit-space.html',
            submitCommit: true,
            buttonTitles: {
              submit: gettext('Save')
            },
            class: 'dialog-form',
            dialog: true
          },
          {
            data: {
              name: spaceDetail().details.space.entity.name,
              spaceNames: _.map(cfOrganizationModel.organizations[vm.clusterGuid][vm.organizationGuid].spaces, function (space) {
                return space.entity.name;
              })
            }
          },
          function (spaceData) {
            if (spaceData.name && spaceData.name.length > 0) {
              if (spaceDetail().details.space.entity.name === spaceData.name) {
                return $q.resolve();
              }
              return spaceModel.updateSpace(vm.clusterGuid, vm.organizationGuid, vm.spaceGuid,
                {name: spaceData.name})
                .then(function () {
                  appNotificationsService.notify('success', gettext('Space \'{{name}}\' successfully updated'),
                    {name: spaceData.name});
                  cardDataObj.title = spaceData.name;
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
        return frameworkDialogConfirm({
          title: gettext('Delete Space'),
          description: gettext('Are you sure you want to delete space') +
          " '" + spaceDetail().details.space.entity.name + "'?",
          submitCommit: true,
          buttonText: {
            yes: gettext('Delete'),
            no: gettext('Cancel')
          },
          errorMessage: gettext('Failed to delete space'),
          callback: function () {
            return spaceModel.deleteSpace(vm.clusterGuid, vm.organizationGuid, vm.spaceGuid)
              .then(function () {
                appNotificationsService.notify('success', gettext('Space \'{{name}}\' successfully deleted'),
                  {name: spaceDetail().details.space.entity.name});
              });
          }
        });
      }
    };
    var assignAction = {
      name: gettext('Assign User(s)'),
      disabled: true,
      execute: function () {
        appClusterAssignUsers.assign({
          clusterGuid: vm.clusterGuid,
          organizationGuid: vm.organizationGuid,
          spaceGuid: vm.spaceGuid
        });
      }
    };

    $scope.$watchCollection(function () {
      var space = spaceDetail();
      if (space && space.roles && space.roles[user.guid]) {
        return space.roles[user.guid];
      }
    }, function (roles) {
      // Present the user's roles
      vm.roles = spaceModel.spaceRolesToStrings(roles);
    });

    // Ensure the parent state is fully initialised before we start our own init
    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.detail.spaces', $state, init);

    function enableActions() {
      vm.actions = [];

      // Rename Space
      var canRename = authModel.isAllowed(vm.clusterGuid, authModel.resources.space, authModel.actions.rename,
        spaceDetail().details.guid, vm.organizationGuid);
      if (canRename || isAdmin) {
        renameAction.disabled = false;
        vm.actions.push(renameAction);
      }

      // Delete Space
      var canDelete = authModel.isAllowed(vm.clusterGuid, authModel.resources.space, authModel.actions.delete,
        vm.organizationGuid);
      if (canDelete || isAdmin) {
        deleteAction.disabled = !vm.canDelete;
        vm.actions.push(deleteAction);
      }

      // User Assignment
      var canAssign = authModel.isOrgOrSpaceActionableByResource(vm.clusterGuid,
        cfOrganizationModel.organizations[vm.clusterGuid][vm.organizationGuid],
        authModel.actions.update);
      if (canAssign || isAdmin) {
        assignAction.disabled = false;
        vm.actions.push(assignAction);
      }

      if (vm.actions.length < 1) {
        delete vm.actions;
      }
    }

    function summary() {
      $state.go('endpoint.clusters.cluster.organization.space.detail.applications', {space: vm.space.metadata.guid});
    }

    function spaceDetail() {
      return spaceModel.fetchSpace(vm.clusterGuid, vm.spaceGuid);
    }

    function cardData() {
      return cardDataObj;
    }

    function init() {
      if (destroyed) {
        return $q.resolve();
      }

      var spaceDetailObj = spaceDetail();

      vm.memory = appUtilsService.sizeUtilization(spaceDetailObj.details.memUsed, spaceDetailObj.details.memQuota);

      // Update these counts per tile, meaning the core getSpaceDetails does not block in the case of 100s of
      // spaces but instead shows list and updates when async data returns
      var updatePromises = [];
      if (angular.isUndefined(spaceDetailObj.details.totalRoutes)) {
        updatePromises.push(spaceModel.updateRoutesCount(vm.clusterGuid, vm.spaceGuid));
      }
      if (angular.isUndefined(spaceDetailObj.details.totalServiceInstances)) {
        updatePromises.push(spaceModel.updateServiceInstanceCount(vm.clusterGuid, vm.spaceGuid));
      }

      return $q.all(updatePromises).then(function () {

        vm.canDelete = spaceDetailObj.details.totalRoutes === 0 &&
          spaceDetailObj.details.totalServiceInstances === 0 &&
          spaceDetailObj.details.totalApps === 0;

        enableActions();

        return $q.resolve();
      });

    }

  }

})();
