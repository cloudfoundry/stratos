(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list')
    .directive('tableView', tableView);

  tableView.$inject = [];

  function tableView() {
    return {
      bindToController: {
        apps: '='
      },
      controller: TableViewController,
      controllerAs: 'tableViewCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/' +
      'table-view/table-view.html'
    };
  }

  TableViewController.$inject = [
    '$scope',
    'app.model.modelManager'
  ];

  function TableViewController($scope, modelManager) {

    var that = this;
    var model = modelManager.retrieve('cloud-foundry.model.application');
    this.stApps = [];
    this.tableColumns = [
      {name: gettext('Application Name'), value: 'entity.name'},
      {name: gettext('Status'), value: 'state.label'},
      {name: gettext('Instances'), value: 'instanceCount'},
      {name: gettext('Disk Quota'), value: 'entity.disk_quota'},
      {name: gettext('Memory Quota'), value: 'entity.memory'},
      {name: gettext('Creation Date'), value: 'metadata.created_at'}
    ];

    function updateStTableState() {
      // St-table internally maintains its own copy of rows
      // When using a custom pipe function we need to do ourselves
      that.stApps = [].concat(that.apps);
    }

    $scope.$watch(
      function () {
        return model.currentSortOption + '_' + model.sortAscending;
      },
      function () {
        updateStTableState();
      }
    );

    $scope.$watchCollection(
      function () {
        return that.apps;
      },
      function () {
        updateStTableState();
      }
    );
    this.getAppSummaryLink = getAppSummaryLink;
    this.setSortClass = setSortClass;
    this.stMiddleware = stMiddleware;

    /**
     * @name getAppSummaryLink
     * @description Get link to application summary page
     * @param {object} app The application object
     * @returns {string} returns the link to the app summary page
     */
    function getAppSummaryLink(app) {
      return '#/cf/applications/' + app.clusterId + '/app/' + app.metadata.guid + '/summary';
    }

    function setSortClass(column) {
      if (column.value === model.currentSortOption) {
        return model.sortAscending ? 'true' : 'reverse';
      }
      return undefined;
    }

    function stMiddleware(tableState) {

      if (_.isUndefined(tableState.sort.predicate)) {
        tableState.sort.predicate = model.currentSortOption;
        tableState.sort.reverse = !model.sortAscending;
        return;
      } else {
        model.currentSortOption = tableState.sort.predicate;
        model.sortAscending = !tableState.sort.reverse;
      }
      updateStTableState();
      tableState.pagination.numberOfPages = 1;
    }
  }

})();
