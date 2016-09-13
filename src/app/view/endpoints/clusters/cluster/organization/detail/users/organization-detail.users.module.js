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
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');

    this.rolesService = rolesService;

    this.userRoles = {};
    this.userActions = {};

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
        var unEditableSpace = false;
        // Format that in an array of pairs for direct use in the template
        _.forEach(myRoles, function (spaceRoles, spaceGuid) {
          _.forEach(spaceRoles, function (role) {
            that.userRoles[aUser.metadata.guid].push({
              space: that.spaceModel.spaces[that.guid][spaceGuid],
              role: role,
              roleLabel: that.spaceModel.spaceRoleToString(role)
            });
            unEditableSpace = unEditableSpace || !that.canRemoveSpaceRole(spaceGuid);
          });
        });

        that.userActions[aUser.metadata.guid] = that.userActions[aUser.metadata.guid]
          ? that.userActions[aUser.metadata.guid] : createUserActions();
        // All manage/change buttons will be the same (dependent on orgs rather than individual user roles)
        that.userActions[aUser.metadata.guid][0].disabled = !that.canEditASpace;
        // Each rows 'Remove All' buttons will be dependent on the signed in user's permissions to edit every role
        // of the user row
        that.userActions[aUser.metadata.guid][1].disabled = unEditableSpace;

      });

      return $q.resolve();
    }

    this.disableManageRoles = function () {
      return this.selectedUsersCount() !== 1 || !that.canEditASpace;
    };

    this.disableChangeRoles = function () {
      return !that.canEditASpace;
    };

    this.disableRemoveFromOrg = function () {
      return this.selectedUsersCount() < 1 || !that.canEditAllSpaces;
    };

    var debouncedUpdateSelection = _.debounce(function () {
      userSelection.deselectInvisibleUsers(that.guid, that.visibleUsers);
      $scope.$apply();
    }, 100);

    function init() {
      var isAdmin = that.stackatoInfo.info.endpoints.hcf[that.guid].user.admin;

      $scope.$watchCollection(function () {
        return that.visibleUsers;
      }, function () {
        if (angular.isDefined(that.visibleUsers) && that.visibleUsers.length > 0) {
          that.selectAllUsers = userSelection.isAllSelected(that.guid, that.visibleUsers);
          debouncedUpdateSelection();
        }
      });

      // Determine if the signed in user can edit ANY of the orgs in this group. If so we can show all 'manage/change'
      // buttons
      $scope.$watchCollection(function () {
        return that.spaceModel.spaces[that.guid];
      }, function () {
        var spaceGuids = _.keys(that.spaceModel.spaces[that.guid]);
        that.canEditASpace = false;
        for (var i = 0; i < spaceGuids.length; i++) {
          if (that.authModel.isAllowed(that.guid, that.authModel.resources.user, that.authModel.actions.update,
              spaceGuids[i], that.organizationGuid, true)) {
            that.canEditASpace = true;
            break;
          }
        }
      });
      // Determine if the signed in user can edit the orgs of all the selected user's roles
      $scope.$watch(function () {
        return that.selectedUsers;
      }, function () {
        that.canEditAllSpaces = true;
        var selectedUsersGuids = _.invert(that.selectedUsers, true).true || [];
        for (var i = 0; i < selectedUsersGuids.length; i++) {
          if (that.userActions[selectedUsersGuids[i]][1].disabled) {
            that.canEditAllSpaces = false;
          }
        }
      }, true);

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

    function createUserActions() {
      return [
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
    }

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

    this.canRemoveSpaceRole = function (spaceGuid) {
      this.cachedcCanRemoveSpaceRol = this.cachedcCanRemoveSpaceRol || {};
      this.cachedcCanRemoveSpaceRol[spaceGuid] = angular.isDefined(this.cachedcCanRemoveSpaceRol[spaceGuid])
        ? this.cachedcCanRemoveSpaceRol[spaceGuid]
        : that.authModel.isAllowed(that.guid, that.authModel.resources.user, that.authModel.actions.update, spaceGuid,
        that.organizationGuid, true);
      return this.cachedcCanRemoveSpaceRol[spaceGuid];
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
      return (_.invert(this.selectedUsers, true).true || []).length;
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
