(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail')
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
    'app.utils.utilsService',
    'app.view.endpoints.clusters.cluster.manageUsers'
  ];

  function SpaceUsersController(modelManager, $stateParams, $state, $log, utils, manageUsers) {
    var that = this;

    this.guid = $stateParams.guid;
    this.spaceGuid = $stateParams.space;
    this.users = [];
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    var isAdmin = stackatoInfo.info.endpoints.hcf[this.guid].user.admin;

    this.userRoles = {};

    this.selectAllUsers = false;
    this.selectedUsers = {};

    function refreshUsers() {
      that.userRoles = {};

      // For each user, get its roles in this space
      _.forEach(that.users, function (aUser) {
        var myRoles = {};
        var space = that.spaceModel.spaces[that.guid][that.spaceGuid];
        if (_.isUndefined(space.roles) || _.isUndefined(space.details)) {
          $log.warn('Space Roles not cached yet!', space);
          return;
        }
        var roles = space.roles[aUser.metadata.guid];
        if (!_.isUndefined(roles)) {
          myRoles[space.details.space.entity.name] = roles;
        }
        that.userRoles[aUser.metadata.guid] = [];

        // Format that in an array of pairs for direct use in the template
        _.forEach(myRoles, function (spaceRoles, spaceName) {
          _.forEach(spaceRoles, function (role) {
            that.userRoles[aUser.metadata.guid].push({
              name: spaceName,
              role: that.spaceModel.spaceRoleToString(role)
            });
          });
        });

      });
    }

    function init() {
      return that.usersModel.listAllUsers(that.guid, {}).then(function (res) {

        $log.debug('Received list of Users: ', res);
        that.users = res;

        return refreshUsers();
      }).then(function () {
        $log.debug('SpaceUsersController finished init');
      });
    }

    this.userActions = [
      {
        name: gettext('Manage Roles'),
        disabled: !isAdmin,
        execute: function (aUser) {
          manageUsers.show(that.guid, [aUser], false).result.then(function () {
            refreshUsers();
          });
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

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.users', $state, init);
  }

})();
