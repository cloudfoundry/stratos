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
          return 'endpoint.clusters.cluster.organization.detail.spaces';
        }
      }
    });
  }

  SpaceUsersController.$inject = [
    '$scope',
    'app.model.modelManager',
    '$stateParams',
    '$state',
    '$log',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.cluster.manageUsers',
    'app.view.endpoints.clusters.cluster.rolesService',
    'app.event.eventService'
  ];

  function SpaceUsersController($scope, modelManager, $stateParams, $state, $log, utils, manageUsers, rolesService, eventService) {
    var that = this;

    this.guid = $stateParams.guid;
    this.spaceGuid = $stateParams.space;
    this.users = [];
    this.removingSpace = {};

    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.rolesService = rolesService;

    this.userRoles = {};

    this.selectAllUsers = false;
    this.selectedUsers = {};

    this.space = that.spaceModel.spaces[that.guid][that.spaceGuid];

    $scope.$watch(function () {
      return rolesService.changingRoles;
    }, function () {
      var isAdmin = that.stackatoInfo.info.endpoints ? that.stackatoInfo.info.endpoints.hcf[that.guid].user.admin : false;
      that.userActions[0].disabled = rolesService.changingRoles || !isAdmin;
      that.userActions[1].disabled = rolesService.changingRoles || !isAdmin;
      that.userActions[2].disabled = rolesService.changingRoles || !isAdmin;
    });

    function refreshUsers() {
      that.userRoles = {};

      // For each user, get its roles in this space
      _.forEach(that.users, function (aUser) {
        if (_.isUndefined(that.space.roles) || _.isUndefined(that.space.details)) {
          $log.warn('Space Roles not cached yet!', that.space);
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
    }

    function init() {
      return that.usersModel.listAllUsers(that.guid, {}).then(function (res) {
        that.users = res;

        return refreshUsers();
      }).then(function () {
        $log.debug('SpaceUsersController finished init');
      });
    }

    this.userActions = [
      {
        name: gettext('Manage Roles'),
        disabled: true,
        execute: function (aUser) {
          return manageUsers.show(that.guid, that.space.details.space.entity.organization_guid, [aUser], false).result;
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
        _.forEach(that.visibleUsers, function (user) {
          that.selectedUsers[user.metadata.guid] = true;
        });
      } else {
        that.selectedUsers = {};
      }
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
      return manageUsers.show(that.guid, that.space.details.space.entity.organization_guid, guidsToUsers(), true).result;
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
