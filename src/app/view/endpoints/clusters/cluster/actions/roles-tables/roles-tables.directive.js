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
        orgRoles: '=',
        spaceRoles: '=',
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

    this.org = [this.organization];
    // this.spaces = [];
    this.spaces = _.map(this.organization.spaces, function (space) {
      return {
        label: space.entity.name,
        key: space.metadata.guid
      };
    });
  }

})();
