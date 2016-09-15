(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.users', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.detail.users', {
      url: '/users',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/detail/users/organization-detail-users.html',
      controller: OrganizationUsersController,
      controllerAs: 'organizationUsersController',
      ncyBreadcrumb: {
        label: '{{' +
        'clusterOrgController.organizationModel.organizations[clusterOrgController.clusterGuid][clusterOrgController.organizationGuid].details.org.entity.name || ' +
        '"..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.detail.users';
        }
      }
    });
  }

  OrganizationUsersController.$inject = [
    '$scope',
    '$state',
    '$stateParams',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.cluster.manageUsers',
    'app.view.endpoints.clusters.cluster.rolesService',
    'app.event.eventService',
    'app.view.userSelection'
  ];

  function OrganizationUsersController($scope, $state, $stateParams, $q,
                                       modelManager, utils, manageUsers, rolesService, eventService, userSelection) {
    var that = this;

    this.guid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.users = [];
    this.removingSpace = {};

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');

    this.rolesService = rolesService;

    this.userRoles = {};

    this.selectedUsers = userSelection.getSelectedUsers(this.guid);
    this.stateInitialised = false;

    function refreshUsers() {
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

    this.canUserManageRoles = function (org) {
      // User can assign org roles
      return that.authModel.isAllowed(that.guid, that.authModel.resources.user, that.authModel.actions.update, org.metadata.guid);
    };

    this.canUserRemoveFromOrg = function (org) {
      return that.authModel.isAllowed(that.guid, that.authModel.resources.user, that.authModel.actions.update, org.metadata.guid);
    };

    this.disableManageRoles = function () {
      return this.rolesService.changingRoles ||
        this.selectedUsersCount() !== 1 || !this.canUserManageRoles(that.organizationModel.organizations[that.guid][that.organizationGuid].details.org);
    };

    this.disableChangeRoles = function () {
      return this.rolesService.changingRoles || !this.canUserManageRoles(that.organizationModel.organizations[that.guid][that.organizationGuid].details.org);
    };

    this.disableRemoveFromOrg = function () {
      return this.rolesService.changingRoles ||
        this.selectedUsersCount() < 1 || !this.canUserManageRoles(that.organizationModel.organizations[that.guid][that.organizationGuid].details.org);
    };

    var debouncedUpdateSelection = _.debounce(function () {
      userSelection.deselectInvisibleUsers(that.guid, that.visibleUsers);
      $scope.$apply();
    }, 100);

    function refreshAllSelected() {
      that.selectAllUsers = userSelection.isAllSelected(that.guid, _.filter(that.visibleUsers, function (user) {
        // Ignore system users
        return user.entity.username;
      }));
    }

    function init() {
      $scope.$watch(function () {
        return rolesService.changingRoles;
      }, function () {
        that.userActions[0].disabled = rolesService.changingRoles || !that.canUserManageRoles(that.organizationModel.organizations[that.guid][that.organizationGuid].details.org);
        that.userActions[1].disabled = rolesService.changingRoles || !that.canUserRemoveFromOrg(that.organizationModel.organizations[that.guid][that.organizationGuid].details.org);
      });

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

      return rolesService.listUsers(that.guid)
        .then(function (users) {
          that.users = users;
        })
        .then(refreshUsers).then(function () {
          that.stateInitialised = true;
        });

    }

    this.userActions = [
      {
        name: gettext('Manage Roles'),
        disabled: true,
        execute: function (aUser) {
          return manageUsers.show(that.guid, that.organizationGuid, [aUser]).result;
        }
      },
      {
        name: gettext('Remove from Organization'),
        disabled: true,
        execute: function (aUser) {
          return rolesService.removeFromOrganization(that.guid, that.organizationGuid, [aUser]);
        }
      }
    ];

    this.getSpaceRoles = function (aUser) {
      return that.userRoles[aUser.metadata.guid];
    };

    this.selectAllChanged = function () {
      if (that.selectAllUsers) {
        userSelection.selectUsers(that.guid, _.filter(that.visibleUsers, function (user) {
          // Never select system users
          return user.entity.username;
        }));
      } else {
        userSelection.deselectAllUsers(that.guid);
      }
    };

    this.removeSpaceRole = function (user, spaceRole) {
      var space = spaceRole.space.details.space;
      var pillKey = space.entity.name + spaceRole.roleLabel;
      if (this.removingSpace[pillKey]) {
        return;
      }
      this.removingSpace[pillKey] = true;
      rolesService.removeSpaceRole(that.guid, space.entity.organization_guid, space.metadata.guid, user, spaceRole.role)
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
      return manageUsers.show(that.guid, that.organizationGuid, guidsToUsers()).result;
    };

    this.removeFromOrganization = function () {
      return rolesService.removeFromOrganization(that.guid, that.organizationGuid, guidsToUsers());
    };

    eventService.$on(eventService.events.ROLES_UPDATED, function () {
      refreshUsers();
    });

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.detail.users', $state, init);
  }

})();
