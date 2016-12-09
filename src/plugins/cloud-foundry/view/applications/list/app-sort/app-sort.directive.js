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
    'app.model.modelManager'
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
      {label: 'Application Name', value: 'entity.name'},
      {label: 'Status', value: 'state.label'},
      {label: 'Instance Count', value: 'instanceCount'},
      {label: 'Disk Quota', value: 'entity.disk_quota'},
      {label: 'Memory Utilization', value: 'entity.memory'},
      {label: 'Creation Date', value: 'metadata.created_at'}
    ];

    this.model.currentSortOption = this.model.currentSortOption || this.sortOptions[5].value;
    // Flag for signaling that an update to
    // filteredApplications is currently going on
    this.updatingFilteredApplications = false;
    this.model.sortAscending = angular.isDefined(this.model.sortAscending) ? this.model.sortAscending : false;
    // Used to toggle display of sort action buttons when screen width is too small
    this.showSortActions = true;

    // If currentSortOption and sort order change update filteredApplications
    $scope.$watch(function () {
      // Combine this into one watch so changes in the same digest only kick off one update
      return that.model.currentSortOption + that.model.sortAscending;
    }, function (newVal, oldVal) {
      if (newVal === oldVal) {
        return;
      }
      that.sortFilteredApplications();
    });

    // In case user applied a filter update filteredApplications
    $scope.$watch(function () {
      return that.model.filteredApplications.length;
    }, function (newVal, oldVal) {
      if (newVal === oldVal || that.updatingFilteredApplications) {
        return;
      }
      that.sortFilteredApplications();
    });

    that.sortFilteredApplications();
  }

  angular.extend(ApplicationsSortingController.prototype, {

    /**
     * @name setSortOrder
     * @description Set sort order (asc/desc)
     * @param {boolean} isAscending - Set sort order
     */
    setSortOrder: function (isAscending) {
      this.model.sortAscending = isAscending;
    },

    /**
     * @name sortFilteredApplications
     * @description Sort model.filteredApplications based on the required sort parameters
     *
     */
    sortFilteredApplications: function () {

      this.updatingFilteredApplications = true;
      var path = this.model.currentSortOption;
      var sortOrder = this.model.sortAscending ? 'asc' : 'desc';
      this.model.filteredApplications = _.orderBy(this.model.filteredApplications, function (app) {
        var value = _.get(app, path);
        if (_.isUndefined(value)) {
          if (path === 'instanceCount') {
            return 0;
          }
        }
        try {
          value = value && value.toLowerCase();
        } catch (ignored) {
          // ignored
        }
        return value;
      }, sortOrder);

      var currentPageNumber = this.model.appPage;
      this.model.loadPage(currentPageNumber);
      this.updatingFilteredApplications = false;
    },

    /**
     * @name isCurrentSort
     * @description Helper to apply appropriate style to sort button
     * @param {boolean} option - sort option
     * @returns {boolean}
     */
    isCurrentSort: function (option) {
      return option.value === this.model.currentSortOption;
    },

    /**
     * @name showAscending
     * @description Helper to show appropriate sort order button
     * @param {boolean} option - sort option
     * @returns {boolean}
     */
    showAscending: function (option) {
      return this.isCurrentSort(option) && this.model.sortAscending;
    },

    /**
     * @name showDescending
     * @description Helper to show appropriate sort order button
     * @param {boolean} option - sort option
     * @returns {boolean}
     */
    showDescending: function (option) {
      return this.isCurrentSort(option) && !this.model.sortAscending;
    },

    /**
     * @name sort
     * @description Helper to set the appropriate model sort options
     * @param {boolean} option - sort option
     */
    sort: function (option) {
      // when current sort is different by default switch to ascending
      // when current sort is the same toggle order
      if (option.value !== this.model.currentSortOption) {
        this.model.currentSortOption = option.value;
        this.model.sortAscending = true;
      } else if (option.value === this.model.currentSortOption) {
        // Current sort option is already the same, toggle order
        this.model.sortAscending = !this.model.sortAscending;
      }

    },

    /**
     * @name toggleSortActions
     * @description Helper to toggle
     * @param {boolean} option - sort option
     */
    toggleSortActions: function () {
      this.showSortActions = !this.showSortActions;
    },

    getMessage: function () {
      if (this.showSortActions) {
        return gettext('Show Sort');
      } else {
        return gettext('Hide Sort');
      }
    }

  });

})();
