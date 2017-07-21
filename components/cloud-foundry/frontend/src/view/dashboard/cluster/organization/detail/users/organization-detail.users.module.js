(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.users', [])
    .config(registerRoute)
    .run(registerTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail.users', {
      url: '/users',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/detail/users/organization-detail-users.html',
      controller: OrganizationUsersController,
      controllerAs: 'organizationUsersController',
      ncyBreadcrumb: {
        label: '{{' +
        'clusterOrgController.cfOrganizationModel.organizations[clusterOrgController.clusterGuid][clusterOrgController.organizationGuid].details.org.entity.name || ' +
        '"..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.detail.users';
        }
      }
    });
  }

  function registerTab(cfTabs) {
    cfTabs.orgTabs.push({
      position: 2,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.organization.detail.users',
      uiSrefParam: _.noop,
      label: 'cf.org-info.users-tab-title'
    });
  }

  function OrganizationUsersController($scope, $state, $stateParams, $q, modelManager, appUtilsService, appClusterManageUsers, appClusterRolesService,
                                       appEventService, appUserSelection, cfOrganizationModel) {
    var that = this;

    this.guid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.users = [];
    this.removingSpace = {};

    this.cfOrganizationModel = cfOrganizationModel;
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.consoleInfo = modelManager.retrieve('app.model.consoleInfo');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');

    this.appClusterRolesService = appClusterRolesService;

    this.userRoles = {};
    this.userActions = {};

    this.selectedUsers = appUserSelection.getSelectedUsers(this.guid);
    this.stateInitialised = false;

    function refreshUsers() {
      var user = that.consoleInfo.info.endpoints.cf[that.guid].user;
      that.isAdmin = user.admin;

      that.userRoles = {};

      // For each user, get its roles in all spaces
      _.forEach(that.users, function (aUser) {
        var myRoles = {};
        if (angular.isUndefined(that.spaceModel.spaces)) {
          // Happens if there are no spaces in the org
          return;
        }
        _.forEach(that.spaceModel.spaces[that.guid], function (space) {
          if (_.isUndefined(space.roles) || _.isUndefined(space.details)) {
            // Means this is a space from another org for which we never fetched the details
            return;
          }
          // Skip space from other organizations
          if (space.details.space.entity.organization_guid !== that.organizationGuid) {
            return;
          }
          // Space is in current org, check roles!
          var roles = space.roles[aUser.metadata.guid];
          if (!_.isUndefined(roles)) {
            myRoles[space.details.space.metadata.guid] = roles;
          }
        });
        that.userRoles[aUser.metadata.guid] = [];
        // Format that in an array of pairs for direct use in the template
        _.forEach(myRoles, function (spaceRoles, spaceGuid) {
          _.forEach(spaceRoles, function (role) {
            that.userRoles[aUser.metadata.guid].push({
              space: that.spaceModel.spaces[that.guid][spaceGuid],
              role: role,
              roleLabel: that.spaceModel.spaceRoleToString(role)
            });
          });
        });
      });

      return $q.resolve();
    }

    this.canUserManageRoles = function () {
      return that.authModel.isAllowed(that.guid, that.authModel.resources.organization, that.authModel.actions.update, that.organizationGuid) ||
        _.find(that.authModel.principal[that.guid].userSummary.spaces.managed, { entity: { organization_guid: that.organizationGuid}});
    };

    this.canUserRemoveFromOrg = function () {
      return that.authModel.isAllowed(that.guid, that.authModel.resources.organization, that.authModel.actions.update, that.organizationGuid);
    };

    this.disableManageRoles = function () {
      return this.selectedUsersCount() !== 1 || !that.canUserManageRoles();
    };

    this.disableChangeRoles = function () {
      return !that.canUserManageRoles();
    };

    this.disableRemoveFromOrg = function () {
      return this.selectedUsersCount() < 1 || !that.canUserRemoveFromOrg();
    };

    this.showManageRoles = function () {
      return that.canUserManageRoles();
    };

    this.showRemoveFromOrg = function () {
      return that.canUserRemoveFromOrg();
    };

    this.canAction = function () {
      return that.showManageRoles() || that.showRemoveFromOrg();
    };

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

    var manageRoles = {
      name: 'cf.roles.common-roles-actions.manage-roles',
      disabled: true,
      execute: function (aUser) {
        return appClusterManageUsers.show(that.guid, that.organizationGuid, [aUser]).result;
      }
    };
    var removeFromOrg = {
      name: 'cf.roles.common-roles-actions.remove-all-roles',
      disabled: true,
      execute: function (aUser) {
        return appClusterRolesService.removeFromOrganization(that.guid, that.organizationGuid, [aUser]);
      }
    };

    function init() {
      if (that.canAction()) {
        that.userActions = [];
        if (that.showManageRoles()) {
          manageRoles.disabled = !that.canUserManageRoles();
          that.userActions.push(manageRoles);
        }
        if (that.showRemoveFromOrg()) {
          removeFromOrg.disabled = !that.canUserRemoveFromOrg();
          that.userActions.push(removeFromOrg);
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

      $scope.$watch(function () {
        return _.keys(that.cfOrganizationModel.organizations[that.guid][that.organizationGuid].spaces).length;
      }, refreshUsers);

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

    this.canRemoveSpaceRole = function (spaceGuid) {
      return that.authModel.isAllowed(that.guid, that.authModel.resources.space, that.authModel.actions.update,
        spaceGuid, that.organizationGuid);
    };

    this.removeSpaceRole = function (user, spaceRole) {
      var space = spaceRole.space.details.space;
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
      return appClusterManageUsers.show(that.guid, that.organizationGuid, guidsToUsers()).result;
    };

    this.removeFromOrganization = function () {
      return appClusterRolesService.removeFromOrganization(that.guid, that.organizationGuid, guidsToUsers());
    };

    var rolesUpdatedListener = appEventService.$on(appEventService.events.ROLES_UPDATED, function () {
      refreshUsers();
    });

    // Ensure the parent state is fully initialised before we start our own init
    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.detail.users', $state, init);

    $scope.$on('$destroy', rolesUpdatedListener);
  }

})();
