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
          return 'endpoint.clusters.cluster.detail.organizations';
        }
      }
    });
  }

  OrganizationUsersController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    '$state',
    '$log',
    'app.utils.utilsService'
  ];

  function OrganizationUsersController(modelManager, $stateParams, $state, $log, utils) {
    var that = this;

    this.guid = $stateParams.guid;
    this.users = [];
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');

    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    this.userRoles = {};

    this.selectAllUsers = false;
    this.selectedUsers = {};

    function init() {
      return that.usersModel.listAllUsers(that.guid, {}).then(function (res) {

        $log.debug('Received list of Users: ', res);
        that.users = res;

        // For each user, get its roles in all spaces
        _.forEach(that.users, function (aUser) {
          var myRoles = {};
          _.forEach(that.spaceModel.spaces[that.guid], function (space) {
            if (_.isUndefined(space.roles)) {
              // Prob means this is a space for another org!
              return;
            }
            var roles = space.roles[aUser.metadata.guid];
            if (!_.isUndefined(roles)) {
              myRoles[space.details.space.entity.name] = roles;
            }
          });
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
      }).then(function () {
        $log.debug('OrganizationUsersController finished init');
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
        name: gettext('Remove from Organization'),
        disabled: true,
        execute: function (aUser) {
          $log.info('TODO: implement remove from Organization', aUser);
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
    utils.chainStateResolve('endpoint.clusters.cluster.organization.detail.users', $state, init);
  }

})();
