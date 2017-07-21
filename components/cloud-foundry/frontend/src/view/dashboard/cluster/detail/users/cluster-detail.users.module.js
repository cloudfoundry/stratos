(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.detail.users', [])
    .config(registerRoute)
    .run(registerTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.users', {
      url: '/users',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/users/cluster-detail-users.html',
      controller: ClusterUsersController,
      controllerAs: 'clusterUsersController',
      ncyBreadcrumb: {
        label: '{{ clusterController.userServiceInstanceModel.serviceInstances[clusterController.guid].name ||"..." }}',
        parent: function () {
          return 'endpoint.clusters.tiles';
        }
      }
    });
  }

  function registerTab(cfTabs) {
    cfTabs.clusterTabs.push({
      position: 2,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.detail.users',
      uiSrefParam: _.noop,
      label: 'cf.users'
    });
  }

  function ClusterUsersController($scope, $state, $stateParams, $q, modelManager, appUtilsService, appClusterManageUsers, appClusterRolesService,
                                  appEventService, appUserSelection, cfOrganizationModel) {
    var that = this;

    this.guid = $stateParams.guid;
    this.users = [];
    this.removingOrg = {};
    this.cfOrganizationModel = cfOrganizationModel;
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

      // Determine if the signed in user can edit ANY of the orgs in this group. If so we can show all 'manage/change'
      // buttons
      that.canEditAnOrg = that.authModel.principal[that.guid].userSummary.organizations.managed.length > 0 ||
        that.authModel.principal[that.guid].userSummary.spaces.managed.length > 0;

      // For each user, get her roles in all organizations
      _.forEach(that.users, function (aUser) {
        var aUserRoles = {};
        _.forEach(that.cfOrganizationModel.organizations[that.guid], function (org) {
          var roles = org.roles[aUser.metadata.guid];
          if (angular.isDefined(roles)) {
            aUserRoles[org.details.org.metadata.guid] = roles;
          }
        });

        // Format that for direct use in the template
        that.userRoles[aUser.metadata.guid] = [];
        var unEditableOrg = false;
        _.forEach(aUserRoles, function (orgRoles, orgGuid) {
          _.forEach(orgRoles, function (role) {
            that.userRoles[aUser.metadata.guid].push({
              org: that.cfOrganizationModel.organizations[that.guid][orgGuid],
              role: role,
              roleLabel: that.cfOrganizationModel.organizationRoleToString(role)
            });
            unEditableOrg = unEditableOrg ||
                !that.authModel.isAllowed(that.guid, that.authModel.resources.organization, that.authModel.actions.update, orgGuid);
          });
        });

        if (that.showTopAction()) {
          that.userActions[aUser.metadata.guid] = that.userActions[aUser.metadata.guid] || createUserActions();
          // All manage/change buttons will be the same (dependent on orgs rather than individual user roles)
          that.userActions[aUser.metadata.guid][0].disabled = !that.canEditAnOrg;
          // Each rows 'Remove All' buttons will be dependent on the signed in user's permissions to edit every role
          // of the user row
          that.userActions[aUser.metadata.guid][1].disabled = unEditableOrg;
        } else {
          delete that.userActions[aUser.metadata.guid];
        }
      });

      that.haveShownAnAction = Object.keys(that.userActions).length;

      return $q.resolve();
    }

    this.disableManageRoles = function () {
      return this.selectedUsersCount() !== 1 || !that.canEditAnOrg;
    };

    this.disableChangeRoles = function () {
      return !this.canEditAnOrg;
    };

    this.disableRemoveFromOrg = function () {
      return this.selectedUsersCount() < 1 || !this.canEditAllOrgs;
    };

    this.showTopAction = function () {
      return this.canEditAnOrg || this.isAdmin;
    };

    // We need the debounce to account for SmartTable delays
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

    function init() {

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
        return _.keys(that.cfOrganizationModel.organizations[that.guid]).length;
      }, refreshUsers);

      return appClusterRolesService.listUsers(that.guid)
        .then(function (users) {
          that.users = users;
        })
        .then(refreshUsers).then(function () {
          // Determine if the signed in user can edit the orgs of all the selected user's roles
          $scope.$watch(function () {
            return that.selectedUsers;
          }, function () {
            that.canEditAllOrgs = true;
            var selectedUsersGuids = _.invert(that.selectedUsers, true).true || [];
            for (var i = 0; i < selectedUsersGuids.length; i++) {
              if (that.userActions[selectedUsersGuids[i]][1].disabled) {
                that.canEditAllOrgs = false;
              }
            }
          }, true);

          that.stateInitialised = true;
        });

    }

    function createUserActions() {
      return [
        {
          name: 'cf.roles.common-roles-actions.manage-roles',
          disabled: true,
          execute: function (aUser) {
            return appClusterManageUsers.show(that.guid, false, [aUser]).result;
          }
        },
        {
          name: 'cf.roles.common-roles-actions.remove-all-roles',
          disabled: true,
          execute: function (aUser) {
            return appClusterRolesService.removeAllRoles(that.guid, [aUser]);
          }
        }
      ];
    }

    this.getOrganizationsRoles = function (aUser) {
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

    this.canRemoveOrgRole = function (user, orgRole) {
      return appClusterRolesService.canRemoveOrgRole(orgRole.role, orgRole.org.details.cnsiGuid, orgRole.org.details.guid, user.metadata.guid);
    };

    this.removeOrgRole = function (user, orgRole) {
      var pillKey = orgRole.org.details.org.entity.name + orgRole.roleLabel;
      if (this.removingOrg[pillKey]) {
        return;
      }
      this.removingOrg[pillKey] = true;
      appClusterRolesService.removeOrgRole(that.guid, orgRole.org.details.org.metadata.guid, user, orgRole.role)
        .finally(function () {
          that.removingOrg[pillKey] = false;
        });
    };

    this.selectedUsersCount = function () {
      return (_.invert(that.selectedUsers, true).true || []).length;
    };

    function guidsToUsers(users) {
      var selectedUsersGuids = _.invert(users, true).true;
      return _.filter(that.users, function (user) {
        return _.indexOf(selectedUsersGuids, user.metadata.guid) >= 0;
      });
    }

    this.manageSelectedUsers = function () {
      return appClusterManageUsers.show(that.guid, false, guidsToUsers(that.selectedUsers));
    };

    this.removeAllRoles = function () {
      return appClusterRolesService.removeAllRoles(that.guid, guidsToUsers(that.selectedUsers));
    };

    var rolesUpdatedListener = appEventService.$on(appEventService.events.ROLES_UPDATED, function () {
      refreshUsers();
    });

    // Ensure the parent state is fully initialised before we start our own init
    appUtilsService.chainStateResolve('endpoint.clusters.cluster.detail.users', $state, init);

    $scope.$on('$destroy', rolesUpdatedListener);
  }

})();
