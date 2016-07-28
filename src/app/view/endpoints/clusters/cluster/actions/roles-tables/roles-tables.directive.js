(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .directive('rolesTablesSearch',function () {
      return {
        require:'^stTable',
        restrict: 'A',
        scope:{
          rolesTablesSearch:'='
        },
        link:function (scope, ele, attr, ctrl) {
          scope.$watch('rolesTablesSearch',function (val) {
            ctrl.search(val, attr.rolesTablesSearchBy);
          });
        }
      };
    })
    .directive('rolesTables', RolesTables);

  RolesTables.$inject = [];

  function RolesTables() {
    return {
      bindToController: {
        config: '=',
        organization: '=',
        selection: '=',
        originalSelection: '=',
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
    '$state',
    '$stateParams',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'helion.framework.widgets.dialog.confirm',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name OrganizationSummaryTileController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $state - the angular $scope service
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $q - the angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.utils.utilsService} utils - the console utils service
   * @param {object} confirmDialog - our confirmation dialog service
   * @param {object} asyncTaskDialog - our async dialog service
   */
  function RolesTablesController($scope, $state, $stateParams, $q,
                                 modelManager, utils, confirmDialog, asyncTaskDialog) {
    var that = this;

    $scope.$watch(function () {
      return that.organization;
    }, refresh);

    function refresh() {
      // Convert the cached organization roles into a keyed object of truthies required to run the check boxes
      var orgRolesByUser = that.organization.roles;
      // At the moment we're only dealing with one user. See TEAMFOUR-708 for bulk users
      var user = that.config.users[0];
      var userRoles = orgRolesByUser[user.metadata.guid];
      _.set(that.selection, 'organization', _.keyBy(userRoles));

      // Convert the cached space roles into a keyed object of truthies required to run the check boxes
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.forEach(that.organization.spaces, function (space) {
        var spaceRoles = spaceModel.spaces[that.config.clusterGuid][space.metadata.guid].roles[user.metadata.guid];
        _.set(that.selection, 'spaces.' + space.metadata.guid, _.keyBy(spaceRoles));
      });

      that.originalSelection = angular.fromJson(angular.toJson(that.selection));

      that.org = [that.organization];
      // that.spaces = [];
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
