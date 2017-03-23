(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list')
    .directive('applicationsSorting', applicationsSorting);

  applicationsSorting.$inject = [];

  function applicationsSorting() {
    return {
      controller: ApplicationsSortingController,
      controllerAs: 'applicationsSortingCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/' +
      'app-sort/app-sort.html'
    };
  }

  ApplicationsSortingController.$inject = [
    '$scope',
    'modelManager'
  ];

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

    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    this.sortOptions = [
      {label: 'App Name', value: 'entity.name'},
      // This one relies on app state, which we don't have yet
      //{label: 'Status (a-z)', value: 'state.label.asc', sort: 'state.label'},
      {label: 'Instances', value: 'entity.instances', descendingFirst: true},
      {label: 'Disk Quota', value: 'entity.disk_quota', descendingFirst: true},
      {label: 'Memory', value: 'entity.memory', descendingFirst: true},
      {label: 'Creation Date', value: 'metadata.created_at', descendingFirst: true}
    ];

    // If currentSortOption and sort order change update filteredApplications
    $scope.$watch(function () {
      // Combine this into one watch so changes in the same digest only kick off one update
      return that.model.currentSortOption + that.model.sortAscending;
    }, function (newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }
      that.ensureOptionSelected();
      that.model.reSort();
    });

    this.ensureOptionSelected();
  }

  angular.extend(ApplicationsSortingController.prototype, {

    /**
     * @name ensureOptionSelected
     * @description Ensure that the correct sort option is selected in the drop down
     */
    ensureOptionSelected: function () {
      // Find the menu item that matches the current sort order
      var selectedSortItem = _.find(this.sortOptions, {value: this.model.currentSortOption});
      var option = selectedSortItem.value;
      if (option !== this.selectedOption) {
        this.selectedOption = option;
      }
    },

    /**
     * @name setSort
     * @description Set the sort option and reset the direction to that option's default
     */
    setSort: function () {
      var item = _.find(this.sortOptions, {value: this.selectedOption});
      if (item) {
        if (item.value !== this.model.currentSortOption) {
          this.model.currentSortOption = item.value;
          // Reset the direction to that option's default
          this.model.sortAscending = !item.descendingFirst;
        }
      }
    },

    /**
     * @name setSortOrder
     * @description Set sort order (asc/desc)
     * @param {boolean} isAscending - Set sort order
     */
    setSortOrder: function (isAscending) {
      this.model.sortAscending = isAscending;
    },

    /**
     * @name setSortOrder
     * @description Toggle the sort order (asc/desc)
     */
    toggleSortOrder: function () {
      this.model.sortAscending = !this.model.sortAscending;
    }

  });
})();
