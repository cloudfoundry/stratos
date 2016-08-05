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
    'app.model.modelManager',
    '$stateParams',
    '$state',
    '$log',
    '$q',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.cluster.manageUsers',
    'app.view.endpoints.clusters.cluster.rolesService',
    'app.event.eventService'
  ];

  function SpaceUsersController(modelManager, $stateParams, $state, $log, $q, utils, manageUsers, rolesService, eventService) {
    var that = this;

    this.guid = $stateParams.guid;
    this.spaceGuid = $stateParams.space;
    this.users = [];
    this.removingSpace = {};
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.userRoles = {};

    this.selectAllUsers = false;
    this.selectedUsers = {};

    this.space = that.spaceModel.spaces[that.guid][that.spaceGuid];

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
      return $q.resolve();
    }

    function init() {
      return that.usersModel.listAllUsers(that.guid, {}).then(function (res) {

        that.userActions[0].disabled = !stackatoInfo.info.endpoints.hcf[that.guid].user.admin;

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
          return manageUsers.show(that.guid, [aUser], false).result;
        }
      },
      {
        name: gettext('Remove from Organization'),
        disabled: true,
        execute: function (aUser) {
          $log.info('TODO: implement remove from Organization', aUser);
        }
      },
      {
        name: gettext('Remove from Space'),
        disabled: true,
        execute: function (aUser) {
          $log.info('TODO: implement remove from Space', aUser);
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
        .catch(function () {
          $log.error('Failed to remove role \'' + spaceRole.roleLabel + '\' for user \'' + user.entity.username + '\'');
        })
        .finally(function () {
          that.removingSpace[pillKey] = false;
        });
    };

    eventService.$on(eventService.events.ROLES_UPDATED, function () {
      refreshUsers();
    });

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.users', $state, init);
  }

})();
