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
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail-users.html',
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
    'app.utils.utilsService'
  ];

  function ClusterUsersController(modelManager, $stateParams, $state, $log, utils) {
    var that = this;

    this.guid = $stateParams.guid;
    this.users = [];
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');

    this.userRoles = {};

    this.selectAllUsers = false;
    this.selectedUsers = {};

    function init() {
      return that.usersModel.listAllUsers(that.guid, {}).then(function (res) {

        $log.debug('Received list of Users: ', res);
        that.users = res;

        // For each user, get its roles in all organization
        _.forEach(that.users, function (aUser) {
          var myRoles = {};
          _.forEach(that.organizationModel.organizations[that.guid], function (org) {
            var roles = org.roles[aUser.metadata.guid];
            if (!_.isUndefined(roles)) {
              myRoles[org.details.org.entity.name] = roles;
            }
          });
          that.userRoles[aUser.metadata.guid] = [];

          // Format that in an array of pairs for direct use in the template
          _.forEach(myRoles, function (orgRoles, orgName) {
            _.forEach(orgRoles, function (role) {
              that.userRoles[aUser.metadata.guid].push({
                name: orgName,
                role: that.organizationModel.organizationRoleToString(role)
              });
            });
          });

        });
      }).then(function () {
        $log.debug('ClusterUsersController finished init');
      });
    }

    this.userActions = [
      {
        name: gettext('Manage Roles'),
        disabled: true,
        execute: function (aUser) {
          $log.info('TODO: implement manage roles', aUser);
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
    utils.chainStateResolve('endpoint.clusters.cluster.detail.users', $state, init);
  }

})();
