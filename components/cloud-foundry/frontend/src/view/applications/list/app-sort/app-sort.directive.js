(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list')
    .directive('applicationsSorting', applicationsSorting);

  function applicationsSorting() {
    return {
      controller: ApplicationsSortingController,
      controllerAs: 'applicationsSortingCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/' +
      'app-sort/app-sort.html'
    };
  }

  /**
   * @name ApplicationsSortingController
   * @description Controller for app-sort directive
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} $scope - the Angular $scope service
   * @property {app.model.modelManager} modelManager - the Model management service
   */
  function ApplicationsSortingController($scope, modelManager) {

    var vm = this;

    var model = modelManager.retrieve('cloud-foundry.model.application');

    vm.sortOptions = [
      {label: 'app-wall.table.columns.appName-sort-by', value: 'entity.name'},
      // This one relies on app state, which we don't have yet
      //{label: 'Status (a-z)', value: 'state.label.asc', sort: 'state.label'},
      {label: 'app-wall.table.columns.instances-sort-by', value: 'entity.instances', descendingFirst: true},
      {label: 'app-wall.table.columns.disk-sort-by', value: 'entity.disk_quota', descendingFirst: true},
      {label: 'app-wall.table.columns.memory-sort-by', value: 'entity.memory', descendingFirst: true},
      {label: 'app-wall.table.columns.creation-sort-by', value: 'metadata.created_at', descendingFirst: true}
    ];

    vm.setSort = setSort;
    vm.setSortOrder = setSortOrder;
    vm.toggleSortOrder = toggleSortOrder;

    // If currentSortOption and sort order change update filteredApplications
    $scope.$watch(function () {
      // Combine this into one watch so changes in the same digest only kick off one update
      return model.currentSortOption + model.sortAscending;
    }, function (newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }
      ensureOptionSelected();
      model.reSort();
    });

    ensureOptionSelected();

    /**
     * @name ensureOptionSelected
     * @description Ensure that the correct sort option is selected in the drop down
     */
    function ensureOptionSelected() {
      // Find the menu item that matches the current sort order
      var selectedSortItem = _.find(vm.sortOptions, {value: model.currentSortOption});
      var option = selectedSortItem.value;
      if (option !== vm.selectedOption) {
        vm.selectedOption = option;
      }
    }

    /**
     * @name setSort
     * @description Set the sort option and reset the direction to that option's default
     */
    function setSort() {
      var item = _.find(vm.sortOptions, {value: vm.selectedOption});
      if (item) {
        if (item.value !== model.currentSortOption) {
          model.currentSortOption = item.value;
          // Reset the direction to that option's default
          model.sortAscending = !item.descendingFirst;
        }
      }
    }

    /**
     * @name setSortOrder
     * @description Set sort order (asc/desc)
     * @param {boolean} isAscending - Set sort order
     */
    function setSortOrder(isAscending) {
      model.sortAscending = isAscending;
    }

    /**
     * @name setSortOrder
     * @description Toggle the sort order (asc/desc)
     */
    function toggleSortOrder() {
      model.sortAscending = !model.sortAscending;
    }

  }
})();
