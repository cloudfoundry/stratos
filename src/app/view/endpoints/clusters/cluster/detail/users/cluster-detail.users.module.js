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
    'app.model.modelManager',
    '$stateParams',
    '$state',
    '$log',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.cluster.manageUsers',
    'app.view.endpoints.clusters.cluster.rolesService'
  ];

  function ClusterUsersController(modelManager, $stateParams, $state, $log, utils, manageUsers, rolesService) {
    var that = this;

    this.guid = $stateParams.guid;
    this.users = [];
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.userRoles = {};

    this.selectAllUsers = false;
    this.selectedUsers = {};

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

        that.userActions[0].disabled = !stackatoInfo.info.endpoints.hcf[that.guid].user.admin;

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
          manageUsers.show(that.guid, [aUser], true).result.then(function () {
            refreshUsers();
          });
        }
      },
      {
        name: gettext('Remove all roles'),
        disabled: true,
        execute: function (aUser) {
          $log.info('TODO: implement remove all roles', aUser);
        }
      }
    ];

    this.getOrganizationsRoles = function (aUser) {
      return that.userRoles[aUser.metadata.guid];
    };

    this.selectAllChanged = function (selectedUsers) {
      if (that.selectAllUsers) {
        _.forEach(that.visibleUsers, function (user) {
          selectedUsers[user.metadata.guid] = true;
        });
      } else {
        selectedUsers = {};
      }
    };

    this.removeOrgRole = function (user, orgRole) {
      this.removingOrg = true;
      rolesService.removeOrgRole(that.guid, orgRole.org.details.org.metadata.guid, user, orgRole.role)
        .then(function () {
          return refreshUsers();
        })
        .catch(function () {
          $log.error('Failed to remove role \'' + orgRole.roleLabel + '\' for user \'' + user.entity.username + '\'');
        })
        .finally(function () {
          that.removingOrg = false;
        });
    };

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.cluster.detail.users', $state, init);
  }

})();
