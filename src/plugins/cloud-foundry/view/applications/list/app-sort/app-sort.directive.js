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

  function ApplicationsSortingController($scope, modelManager) {

    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    this.sortOptions = [
      {label: 'Application Name', value: 'entity.name'},
      {label: 'Status', value: 'state.label'},
      {label: 'Instances', value: 'instanceCount'},
      {label: 'Disk Quota', value: 'entity.disk_quota'},
      {label: 'Memory Utilization', value: 'entity.memory'},
      // {label: 'Creation Date', value: 'metadata.created_at'}
    ];
    this.model.currentSortOption = this.sortOptions[0].value;
    this.updatingFilteredApplications = false;
    this.model.sortAscending = true;

    $scope.$watch(function () {
      return that.model.currentSortOption;
    }, function () {
      that.sortFilteredApplications();
    });

    $scope.$watch(function () {
      return that.model.sortAscending;
    }, function () {
      that.sortFilteredApplications();
    });

    // // In case filter is updated
    $scope.$watchCollection(function () {
      return that.model.filteredApplications;
    }, function () {
      if (that.updatingFilteredApplications) {
        return;
      }
      that.sortFilteredApplications();
    });
  }

  angular.extend(ApplicationsSortingController.prototype, {

    setSortOrder: function (isAscending) {
      this.model.sortAscending = isAscending;
    },

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
        return value;
      }, sortOrder);

      var currentPageNumber = this.model.appPage;
      this.model.loadPage(currentPageNumber);
      this.updatingFilteredApplications = false;
    },

    isCurrentSort: function (option) {
      return option.value === this.model.currentSortOption;
    },

    showAscending: function (option) {
      return this.isCurrentSort(option) && this.model.sortAscending;
    },

    showDescending: function (option) {
      return this.isCurrentSort(option) && !this.model.sortAscending;
    },

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

    }

  });

})();
