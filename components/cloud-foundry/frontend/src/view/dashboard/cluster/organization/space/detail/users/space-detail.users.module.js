(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.space.detail.users', [])
    .config(registerRoute)
    .run(registerTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail.users', {
      url: '/users',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/space/detail/users/space-detail-users.html',
      controller: SpaceUsersController,
      controllerAs: 'spaceUsersController',
      ncyBreadcrumb: {
        label: '{{ clusterSpaceController.space().details.space.entity.name || "..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.organization.detail.users';
        }
      }
    });
  }

  function registerTab(cfTabs) {
    cfTabs.spaceTabs.push({
      position: 4,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.organization.space.detail.users',
      uiSrefParam: _.noop,
      label: 'cf.space-info.tabs.users.title'
    });
  }

  function SpaceUsersController($scope, $state, $stateParams, $log, $q, modelManager, appUtilsService, appClusterManageUsers, appClusterRolesService,
                                appEventService, appUserSelection, cfOrganizationModel) {
    var that = this;

    this.guid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.users = [];
    this.removingSpace = {};

    this.cfOrganizationModel = cfOrganizationModel;
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.consoleInfo = modelManager.retrieve('app.model.consoleInfo');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.appClusterRolesService = appClusterRolesService;

    this.userRoles = {};

    this.selectedUsers = appUserSelection.getSelectedUsers(this.guid);
    this.stateInitialised = false;

    this.space = that.spaceModel.spaces[that.guid][that.spaceGuid];

    function refreshUsers() {
      var user = that.consoleInfo.info.endpoints.cf[that.guid].user;
      that.isAdmin = user.admin;

      that.userRoles = {};

      // For each user, get its roles in this space
      _.forEach(that.users, function (aUser) {
        if (_.isUndefined(that.space.roles) || _.isUndefined(that.space.details)) {
          $log.debug('Space Roles not cached yet?', that.space);
          return;
        }
        that.userRoles[aUser.metadata.guid] = [];

        // Format that in an array of pairs for direct use in the template
        _.forEach(that.space.roles[aUser.metadata.guid] || [], function (role) {
          that.userRoles[aUser.metadata.guid].push({
            role: role,
            roleLabel: that.spaceModel.spaceRoleToString(role)
          });
        });

      });
      return $q.resolve();
    }

    var debouncedUpdateSelection = _.debounce(function () {
      appUserSelection.deselectInvisibleUsers(that.guid, that.visibleUsers);
      $scope.$apply();
    }, 100);

    function refreshAllSelected() {
      that.selectAllUsers = appUserSelection.isAllSelected(that.guid, _.filter(that.visibleUsers, function (user) {
        // Ignore system users
        return user.entity.username;
      }));
    }

    this.canUserManageRoles = function () {
      // User can assign org roles
      return that.authModel.isAllowed(that.guid, that.authModel.resources.organization, that.authModel.actions.update, that.organizationGuid) ||
        // User can assign space roles
        that.authModel.isAllowed(that.guid, that.authModel.resources.space, that.authModel.actions.update, that.spaceGuid, that.organizationGuid);
    };

    this.canUserRemoveFromOrg = function () {
      return that.authModel.isAllowed(that.guid, that.authModel.resources.organization, that.authModel.actions.update, that.organizationGuid);
    };

    this.canUserRemoveFromSpace = function () {
      return that.canUserManageRoles();
    };

    this.disableManageRoles = function () {
      return this.selectedUsersCount() !== 1 || !this.canUserManageRoles();
    };

    this.disableChangeRoles = function () {
      return !this.canUserManageRoles();
    };

    this.disableRemoveFromOrg = function () {
      return this.selectedUsersCount() < 1 || !that.canUserRemoveFromOrg();
    };
    this.disableRemoveFromSpace = function () {
      return this.selectedUsersCount() < 1 || !that.canUserRemoveFromSpace();
    };

    this.showManageRoles = function () {
      return that.canUserManageRoles();
    };

    this.showRemoveFromSpace = function () {
      return that.canUserRemoveFromSpace();
    };

    this.showRemoveFromOrg = function () {
      return that.canUserRemoveFromOrg();
    };

    this.canAction = function () {
      return that.showManageRoles() || that.showRemoveFromOrg() || that.showRemoveFromSpace();
    };
    var manageRoles = {
      name: 'cf.roles.common-roles-actions.manage-roles',
      disabled: true,
      execute: function (aUser) {
        return appClusterManageUsers.show(that.guid, that.space.details.space.entity.organization_guid, [aUser]).result;
      }
    };
    var removeFromOrg = {
      name: 'cf.roles.common-roles-actions.remove-from-org',
      disabled: true,
      execute: function (aUser) {
        return appClusterRolesService.removeFromOrganization(that.guid, that.space.details.space.entity.organization_guid,
          [aUser]);
      }
    };
    var removeFromSpace = {
      name: 'cf.roles.common-roles-actions.remove-from-space',
      disabled: true,
      execute: function (aUser) {
        return appClusterRolesService.removeFromSpace(that.guid, that.space.details.space.entity.organization_guid,
          that.space.details.space.metadata.guid, [aUser]);
      }
    };

    function init() {
      if (that.canAction()) {
        that.userActions = [];
        if (that.showManageRoles()) {
          // Manage Roles - show slide in if user is an admin, org manager or the space manager
          manageRoles.disabled = !that.canUserManageRoles();
          that.userActions.push(manageRoles);
        }
        if (that.showRemoveFromOrg()) {
          //Remove from Organization - remove user from organization if user is an admin or org manager
          removeFromOrg.disabled = !that.canUserRemoveFromOrg();
          that.userActions.push(removeFromOrg);
        }
        if (that.showRemoveFromSpace()) {
          // Remove from Space - remove if user is an admin, org manager or the space manager
          removeFromSpace.disabled = !that.canUserManageRoles();
          that.userActions.push(removeFromSpace);
        }
        if (that.userActions.length < 1) {
          delete that.userActions;
        }
      }

      $scope.$watchCollection(function () {
        return that.visibleUsers;
      }, function () {
        if (angular.isDefined(that.visibleUsers) && that.visibleUsers.length > 0) {
          refreshAllSelected();
          debouncedUpdateSelection();
        }
      });

      $scope.$watch(that.selectedUsersCount, function () {
        refreshAllSelected();
      });

      return appClusterRolesService.listUsers(that.guid)
        .then(function (users) {
          that.users = users;
        })
        .then(refreshUsers).then(function () {
          that.stateInitialised = true;
        });

    }

    this.getSpaceRoles = function (aUser) {
      return that.userRoles[aUser.metadata.guid];
    };

    this.selectAllChanged = function () {
      if (that.selectAllUsers) {
        appUserSelection.selectUsers(that.guid, _.filter(that.visibleUsers, function (user) {
          // Never select system users
          return user.entity.username;
        }));
      } else {
        appUserSelection.deselectAllUsers(that.guid);
      }
    };

    this.removeSpaceRole = function (user, spaceRole) {
      var space = that.space.details.space;
      var pillKey = space.entity.name + spaceRole.roleLabel;
      if (this.removingSpace[pillKey]) {
        return;
      }
      this.removingSpace[pillKey] = true;
      appClusterRolesService.removeSpaceRole(that.guid, space.entity.organization_guid, space.metadata.guid, user, spaceRole.role)
        .finally(function () {
          that.removingSpace[pillKey] = false;
        });
    };

    this.selectedUsersCount = function () {
      return (_.invert(that.selectedUsers, true).true || []).length;
    };

    function guidsToUsers() {
      var selectedUsersGuids = _.invert(that.selectedUsers, true).true;
      return _.filter(that.users, function (user) {
        return _.indexOf(selectedUsersGuids, user.metadata.guid) >= 0;
      });
    }

    this.manageSelectedUsers = function () {
      return appClusterManageUsers.show(that.guid, that.space.details.space.entity.organization_guid, guidsToUsers()).result;
    };

    this.removeFromOrganization = function () {
      var space = that.space.details.space;
      return appClusterRolesService.removeFromOrganization(that.guid, space.entity.organization_guid, guidsToUsers());
    };

    this.removeFromSpace = function () {
      var space = that.space.details.space;
      return appClusterRolesService.removeFromSpace(that.guid, space.entity.organization_guid, space.metadata.guid,
        guidsToUsers());
    };

    var rolesUpdatedListener = appEventService.$on(appEventService.events.ROLES_UPDATED, function () {
      refreshUsers();
    });

    // Ensure the parent state is fully initialised before we start our own init
    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.users', $state, init);

    $scope.$on('$destroy', rolesUpdatedListener);
  }

})();
