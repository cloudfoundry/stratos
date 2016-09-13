(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail.users', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail.users', {
      url: '/users',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/users/space-detail-users.html',
      controller: SpaceUsersController,
      controllerAs: 'spaceUsersController',
      ncyBreadcrumb: {
        label: '{{ clusterSpaceController.space().details.entity.name || "..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.organization.detail.users';
        }
      }
    });
  }

  SpaceUsersController.$inject = [
    '$scope',
    '$state',
    '$stateParams',
    '$log',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.cluster.manageUsers',
    'app.view.endpoints.clusters.cluster.rolesService',
    'app.event.eventService',
    'app.view.userSelection'
  ];

  function SpaceUsersController($scope, $state, $stateParams, $log, $q,
                                modelManager, utils, manageUsers, rolesService, eventService, userSelection) {
    var that = this;

    this.guid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.users = [];
    this.removingSpace = {};

    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.rolesService = rolesService;

    this.userRoles = {};

    this.selectedUsers = userSelection.getSelectedUsers(this.guid);
    this.stateInitialised = false;

    this.space = that.spaceModel.spaces[that.guid][that.spaceGuid];

    function refreshUsers() {
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
      userSelection.deselectInvisibleUsers(that.guid, that.visibleUsers);
      $scope.$apply();
    }, 100);

    this.canUserRemoveFromOrg = function () {
      this.cacheCanUserRemoveFromOrg = angular.isDefined(this.cacheCanUserRemoveFromOrg)
        ? this.cacheCanUserRemoveFromOrg
        : that.authModel.isAllowed(that.guid, that.authModel.resources.user, that.authModel.actions.update, null,
        that.organizationGuid);
      return this.cacheCanUserRemoveFromOrg;
    };

    this.disableManageRoles = function () {
      return this.selectedUsersCount() !== 1 || !this.canRemoveSpaceRole();
    };

    this.disableChangeRoles = function () {
      return !this.canRemoveSpaceRole();
    };

    this.disableRemoveFromOrg = function () {
      return this.selectedUsersCount() < 1 || !this.canUserRemoveFromOrg();
    };
    this.disableRemoveFromSpace = function () {
      return this.selectedUsersCount() < 1 || !this.canRemoveSpaceRole();
    };

    function init() {

      var isAdmin = that.stackatoInfo.info.endpoints.hcf[that.guid].user.admin;

      // Manage Roles - show slide in if user is an admin, org manager or the space manager
      that.userActions[0].disabled = !that.canRemoveSpaceRole();

      //Remove from Organization - remove user from organization if user is an admin or org manager
      that.userActions[1].disabled = !that.canUserRemoveFromOrg();

      // Remove from Space - remove if user is an admin, org manager or the space manager
      that.userActions[2].disabled = !that.canRemoveSpaceRole();

      $scope.$watchCollection(function () {
        return that.visibleUsers;
      }, function () {
        if (angular.isDefined(that.visibleUsers) && that.visibleUsers.length > 0) {
          that.selectAllUsers = userSelection.isAllSelected(that.guid, that.visibleUsers);
          debouncedUpdateSelection();
        }
      });

      // TODO: trigger this from cluster init, make promiseForUsers visible to here then chain it here
      var promiseForUsers;
      if (isAdmin) {
        promiseForUsers = that.usersModel.listAllUsers(that.guid).then(function (res) {
          that.users = res;
        });
      } else {
        var allUsersP = [];
        _.forEach(that.organizationModel.organizations[that.guid], function (org) {
          allUsersP.push(that.organizationModel.retrievingRolesOfAllUsersInOrganization(that.guid, org.details.guid));
        });
        promiseForUsers = $q.all(allUsersP).then(function (results) {
          var allUsers = {};
          _.forEach(results, function (usersArray) {
            _.forEach(usersArray, function (aUser) {
              allUsers[aUser.metadata.guid] = aUser;
            });
          });
          that.users = _.values(allUsers);
        });
      }

      return promiseForUsers.then(refreshUsers).then(function () {
        that.stateInitialised = true;
      });

    }

    this.userActions = [
      {
        name: gettext('Manage Roles'),
        disabled: true,
        execute: function (aUser) {
          return manageUsers.show(that.guid, that.space.details.space.entity.organization_guid, [aUser]).result;
        }
      },
      {
        name: gettext('Remove from Organization'),
        disabled: true,
        execute: function (aUser) {
          return rolesService.removeFromOrganization(that.guid, that.space.details.space.entity.organization_guid,
            [aUser]);
        }
      },
      {
        name: gettext('Remove from Space'),
        disabled: true,
        execute: function (aUser) {
          return rolesService.removeFromSpace(that.guid, that.space.details.space.entity.organization_guid,
            that.space.details.space.metadata.guid, [aUser]);
        }
      }
    ];

    this.getSpaceRoles = function (aUser) {
      return that.userRoles[aUser.metadata.guid];
    };

    this.selectAllChanged = function () {
      if (that.selectAllUsers) {
        userSelection.selectUsers(that.guid, that.visibleUsers);
      } else {
        userSelection.deselectAllUsers(that.guid);
      }
    };

    this.canRemoveSpaceRole = function () {
      this.cacheCanRemoveSpaceRole = angular.isDefined(this.cacheCanRemoveSpaceRole)
        ? this.cacheCanRemoveSpaceRole
        : that.authModel.isAllowed(that.guid, that.authModel.resources.user, that.authModel.actions.update,
        that.spaceGuid, that.organizationGuid, true);
      return this.cacheCanRemoveSpaceRole;
    };

    this.removeSpaceRole = function (user, spaceRole) {
      var space = that.space.details.space;
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
      return manageUsers.show(that.guid, that.space.details.space.entity.organization_guid, guidsToUsers()).result;
    };

    this.removeFromOrganization = function () {
      var space = that.space.details.space;
      return rolesService.removeFromOrganization(that.guid, space.entity.organization_guid, guidsToUsers());
    };

    this.removeFromSpace = function () {
      var space = that.space.details.space;
      return rolesService.removeFromSpace(that.guid, space.entity.organization_guid, space.metadata.guid,
        guidsToUsers());
    };

    eventService.$on(eventService.events.ROLES_UPDATED, function () {
      refreshUsers();
    });

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.users', $state, init);
  }

})();
