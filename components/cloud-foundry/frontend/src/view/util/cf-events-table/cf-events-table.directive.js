(function () {
  'use strict';

  angular
    .module('cloud-foundry.view')
    .directive('cfEventsTable', cfEventsTable);

  /**
   * @name cfEventsTable
   * @returns {object} The cfEventsTable directive definition object
   */
  function cfEventsTable() {
    return {
      bindToController: {
        actee: '=?'
      },
      controller: CfEventsTableController,
      controllerAs: 'cfeCtrl',
      restrict: 'E',
      templateUrl: 'plugins/cloud-foundry/view/util/cf-events-table/cf-events-table.html'
    };
  }

  /**
   * @name CfEventsTableController
   * @constructor
   * @param {object} $stateParams - the ui-router $stateParams service
   * @param {object} modelManager - the model manager service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView frameworkDetailView
   */
  function CfEventsTableController($stateParams, modelManager, frameworkDetailView) {
    var vm = this;
    vm.cfEventModel = modelManager.retrieve('cloud-foundry.model.events');
    vm.cnsiGuid = $stateParams.cnsiGuid;
    vm.events = [];
    vm.itemsPerPage = 10;

    // Get the icon to display for the given event actor type
    vm.iconForType = function (t) {
      switch (t) {
        case 'user':
          return 'person';
        case 'app':
          return 'web_asset';
        case 'process':
          return 'settings';
        default:
          return 'help';
      }
    };

    // Page size options to present to the user
    vm.itemsByPageOptions = [
      {
        label: 'cf.events.page-sizes.five',
        value: 5
      },
      {
        label: 'cf.events.page-sizes.ten',
        value: 10
      },
      {
        label: 'cf.events.page-sizes.twenty',
        value: 20
      },
      {
        label: 'cf.events.page-sizes.fifty',
        value: 50
      }
    ];

    // Smart Table pipe middleware - fetches events from teh CF api
    vm.middleware = function (tableState) {
      vm.isLoading = true;
      var pagination = tableState.pagination;
      var start = pagination.start || 0;
      var number = pagination.number || 10;
      start = Math.round(start / number);
      return vm.getPage(start + 1, number, tableState).then(function (result) {
        vm.events = result.data;
        pagination.numberOfPages = result.numberOfPages;
        pagination.totalItemCount = result.totalItemCount;
        vm.totalItemCount = result.totalItemCount;
      }).catch(function () {
        vm.events = [];
        vm.totalItemCount = -1;
      }).finally(function () {
        vm.isLoading = false;
      });
    };

    // Fetch a page of data
    vm.getPage = function (pageNumber, number) {
      return vm.cfEventModel.fetch(vm.cnsiGuid, vm.actee, pageNumber, number).then(function (response) {
        return {
          data: response.data.resources,
          numberOfPages: response.data.total_pages,
          totalItemCount: response.data.total_results
        };
      });
    };

    vm.showDetail = function (item) {
      frameworkDetailView(
        {
          templateUrl: 'plugins/cloud-foundry/view/util/cf-events-table/cf-events-detail.html',
          dialog: true,
          title: 'cf.events.detail',
          class: 'cf-events-detail-dialog'
        },
        item
      );
    };
  }
})();
