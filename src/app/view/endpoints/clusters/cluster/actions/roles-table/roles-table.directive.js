(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .directive('rolesTable', RolesTable);

  RolesTable.$inject = [];

  function RolesTable() {
    return {
      bindToController: {
        roles: '=',
        groupType: '=',
        groups: '=',
        groupsVisible: '=',
        groupAction: '&',
        selection: '=',
        noGroupsMessage: '='
      },
      controller: RolesTableController,
      controllerAs: 'rolesTableCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/cluster/actions/roles-table/roles-table.html'
    };
  }

  RolesTableController.$inject = [
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
  function RolesTableController($scope, $state, $stateParams, $q,
                                             modelManager, utils, confirmDialog, asyncTaskDialog) {
  }

})();
