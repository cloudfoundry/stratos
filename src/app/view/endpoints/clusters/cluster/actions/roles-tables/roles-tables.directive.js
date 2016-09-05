(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .directive('rolesTables', RolesTables);

  RolesTables.$inject = [];

  function RolesTables() {
    return {
      bindToController: {
        config: '=',
        organization: '=',
        selection: '=',
        filter: '=?'
      },
      controller: RolesTablesController,
      controllerAs: 'rolesTablesCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/actions/roles-tables/roles-tables.html'
    };
  }

  RolesTablesController.$inject = [
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.view.endpoints.clusters.cluster.rolesService'
  ];

  /**
   * @name RolesTablesController
   * @description Controller for a roles tables directive. Will optionally update the model cache
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $q - the angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.view.endpoints.clusters.cluster.rolesService} rolesService - the console roles service. Aids in
   * selecting, assigning and removing roles with the roles table.
   */
  function RolesTablesController($scope, $q, modelManager, rolesService) {
    var that = this;

    this.rolesService = rolesService;
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');

    // If the organization changes, ensure we respond
    $scope.$watch(function () {
      return that.organization;
    }, refresh);

    // Ensure that the org_user is correctly updated given any changes in other org and space roles
    $scope.$watch(function () {
      return that.selection;
    }, function (selection) {
      that.rolesService.updateRoles(selection);
    }, true);

    function rolesToSelection(roles) {
      return _.chain(roles)
        .clone()
        .omitBy(function (value) {
          return !value;
        })
        .mapValues(function () {
          return false;
        })
        .value();
    }

    // Helper to enable/disable space role checkbox inputs
    this.disableAssignSpaceRoles = function (spaceKey) {
      var space = that.organization.spaces[spaceKey];
      return !that.authModel.isAllowed(that.config.clusterGuid,
        that.authModel.resources.user,
        that.authModel.actions.update,
        space.metadata.guid, space.entity.organization_guid,
        true);
    };

    // Helper to enable/disable org role checkbox inputs
    this.disableAssignOrgRoles = function (org) {
      return !that.authModel.isAllowed(that.config.clusterGuid,
        that.authModel.resources.user,
        that.authModel.actions.update,
        null, org.metadata.guid);
    };

    function refresh() {
      // Show either the currently selected roles OR set all roles to false (such that they can be removed later)
      if (_.get(that, 'config.showExistingRoles')) {
        // We only cater for a single user when showing existing rows. Anything more and the current UX would be
        // misleading, so be brutish and throw and exception here
        if (that.config.users.length > 1) {
          throw new Error('roles-table does not support showing existing roles for more than one user');
        }

        // Convert the cached organization roles into a keyed object of truthies required to run the check boxes
        var orgRolesByUser = that.organization.roles;
        // We only support showing existing roles for a single user
        var user = that.config.users[0];
        var userRoles = orgRolesByUser[user.metadata.guid];
        _.set(that.selection, 'organization', _.keyBy(userRoles));

        // Convert the cached space roles into a keyed object of truthies required to run the check boxes
        var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
        _.forEach(that.organization.spaces, function (space) {
          var spaceRoles = spaceModel.spaces[that.config.clusterGuid][space.metadata.guid].roles;
          spaceRoles = _.get(spaceRoles, user.metadata.guid, []);
          _.set(that.selection, 'spaces.' + space.metadata.guid, _.keyBy(spaceRoles));
        });
      } else {
        _.set(that.selection, 'organization', rolesToSelection(that.config.orgRoles));
        _.forEach(that.organization.spaces, function (space) {
          _.set(that.selection, 'spaces.' + space.metadata.guid, rolesToSelection(that.config.spaceRoles));
        });
      }

      // Set the current org and spaces collections
      that.org = [that.organization];
      that.spaces = _.map(that.organization.spaces, function (space) {
        return {
          label: space.entity.name,
          key: space.metadata.guid
        };
      });
    }

    var initPromise = this.config.initPromise || $q.when();
    initPromise.then(function () {
      refresh();
    });
  }

})();
