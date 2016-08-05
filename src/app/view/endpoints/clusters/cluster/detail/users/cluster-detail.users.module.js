(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail.users', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.users', {
      url: '/users',
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/users/cluster-detail-users.html',
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

  ClusterUsersController.$inject = [
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

  function ClusterUsersController($scope, modelManager, $stateParams, $state, $log, utils, manageUsers, rolesService,
                                  eventService) {
    var that = this;

    this.guid = $stateParams.guid;
    this.users = [];
    this.removingOrg = {};
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.rolesService = rolesService;

    this.userRoles = {};

    this.selectAllUsers = false;
    this.selectedUsers = {};

    $scope.$watch(function () {
      return rolesService.changingRoles;
    }, function () {
      var isAdmin = that.stackatoInfo.info.endpoints ? that.stackatoInfo.info.endpoints.hcf[that.guid].user.admin : false;
      that.userActions[0].disabled = rolesService.changingRoles || !isAdmin;
      that.userActions[1].disabled = rolesService.changingRoles || !isAdmin;
    });

    function refreshUsers() {
      that.userRoles = {};

      // For each user, get its roles in all organization
      _.forEach(that.users, function (aUser) {
        var myRoles = {};
        _.forEach(that.organizationModel.organizations[that.guid], function (org) {
          var roles = org.roles[aUser.metadata.guid];
          if (!_.isUndefined(roles)) {
            myRoles[org.details.org.metadata.guid] = roles;
          }
        });
        that.userRoles[aUser.metadata.guid] = [];

        // Format that in an array of pairs for direct use in the template
        _.forEach(myRoles, function (orgRoles, orgGuid) {
          _.forEach(orgRoles, function (role) {
            that.userRoles[aUser.metadata.guid].push({
              org: that.organizationModel.organizations[that.guid][orgGuid],
              role: role,
              roleLabel: that.organizationModel.organizationRoleToString(role)
            });
          });
        });

      });
    }

    function init() {
      return that.usersModel.listAllUsers(that.guid, {}).then(function (res) {
        that.users = res;

        return refreshUsers();
      }).then(function () {
        $log.debug('ClusterUsersController finished init');
      });
    }

    this.userActions = [
      {
        name: gettext('Manage Roles'),
        disabled: true,
        execute: function (aUser) {
          return manageUsers.show(that.guid, false, [aUser], true).result;
        }
      },
      {
        name: gettext('Remove all roles'),
        disabled: true,
        execute: function (aUser) {
          return rolesService.removeAllRoles(that.guid, [aUser]);
        }
      }
    ];

    this.getOrganizationsRoles = function (aUser) {
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

    this.canRemoveOrgRole = function (user, orgRole) {
      return rolesService.canRemoveOrgRole(orgRole.role, orgRole.org.roles[user.metadata.guid]);
    };

    this.removeOrgRole = function (user, orgRole) {
      var pillKey = orgRole.org.details.org.entity.name + orgRole.roleLabel;
      if (this.removingOrg[pillKey]) {
        return;
      }
      this.removingOrg[pillKey] = true;
      rolesService.removeOrgRole(that.guid, orgRole.org.details.org.metadata.guid, user, orgRole.role)
        .finally(function () {
          that.removingOrg[pillKey] = false;
        });
    };

    this.selectedUsersCount = function () {
      return (_.invert(this.selectedUsers, true).true || []).length;
    };

    function guidsToUsers(users) {
      var selectedUsersGuids = _.invert(users, true).true;
      return _.filter(that.users, function (user) {
        return _.indexOf(selectedUsersGuids, user.metadata.guid) >= 0;
      });
    }

    this.manageSelectedUsers = function () {
      return manageUsers.show(that.guid, false, guidsToUsers(that.selectedUsers), true);
    };

    this.removeAllRoles = function () {
      return rolesService.removeAllRoles(that.guid, guidsToUsers(that.selectedUsers));
    };

    eventService.$on(eventService.events.ROLES_UPDATED, function () {
      refreshUsers();
    });

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.detail.users', $state, init);
  }

})();
