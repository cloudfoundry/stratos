(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list')
    .directive('applicationsTable', applicationsTable);

  applicationsTable.$inject = [];

  function applicationsTable() {
    return {
      bindToController: {
        apps: '='
      },
      controller: ApplicationsTableController,
      controllerAs: 'applicationsTableCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/' +
      'gallery-view/applications-table/applications-table.html'
    };
  }

  ApplicationsTableController.$inject = [
    '$scope',
    'app.model.modelManager'
  ];

  function ApplicationsTableController($scope, modelManager) {

    var that = this;
    var model = modelManager.retrieve('cloud-foundry.model.application');
    this.stApps = [];
    this.tableColumns = [
      {name: gettext('Application Name'), value: 'entity.name'},
      {name: gettext('Status'), value: 'state.label'},
      {name: gettext('Instances'), value: 'instanceCount'},
      {name: gettext('Disk Quota'), value: 'entity.disk_quota'},
      {name: gettext('Memory Utilization'), value: 'entity.memory'}
    ];

    $scope.$watch(
      function () {
        return model.currentSortOption + '_' + model.sortAscending;
      },
      function () {
        that.stApps = [].concat(that.apps);
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
      that.stApps = [].concat(that.apps);
      tableState.pagination.numberOfPages = 1;
    }
  }

})();
