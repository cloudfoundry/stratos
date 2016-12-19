(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list')
    .directive('tableView', tableView)
    .directive('stBinding', stBinding);

  // stBinding directive is sued to make the Smart Table controller
  // availale to the table view controller
  stBinding.$inject = [
    '$parse'
  ];

  function stBinding($parse) {
    return {
      require: 'stTable',
      link: function (scope, elem, attrs, ctrl) {
        if (attrs.stBinding) {
          var stBinding = $parse(attrs.stBinding);
          if (stBinding.assign) {
            stBinding.assign(scope, ctrl);
          }
        }
      }
    };
  }

  tableView.$inject = [];

  function tableView() {
    return {
      bindToController: {
        apps: '='
      },
      controller: TableViewController,
      controllerAs: 'tableViewCtrl',
      scope: {},
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
      {name: gettext('Status'), value: 'state.label', noSort: true},
      {name: gettext('Instances'), value: 'entity.instances', descendingFirst: true},
      {name: gettext('Disk Quota'), value: 'entity.disk_quota', descendingFirst: true},
      {name: gettext('Memory'), value: 'entity.memory', descendingFirst: true},
      {name: gettext('Creation Date'), value: 'metadata.created_at', descendingFirst: true}
    ];
    this.init = false;

    function updateStTableState() {
      // St-table internally maintains its own copy of rows
      // When using a custom pipe function we need to do ourselves
      that.stApps = [].concat(that.apps);
    }

    $scope.$watch(
      function () {
        return model.currentSortOption + '_' + model.sortAscending;
      },
      function (nv, ov) {
        if (nv !== ov && that.table) {
          that.table.sortBy(model.currentSortOption, !model.sortAscending);
        }
        updateStTableState();
      }
    );

    //Ensure that if the user searches are filters that the list view updates
    $scope.$watchCollection(
      function () {
        return that.apps;
      }, function () {
      updateStTableState();
    });

    $scope.$watch(
      function () {
        return that.table;
      }, function () {
      if (that.table) {
        that.table.sortBy(model.currentSortOption, !model.sortAscending);
      }
    });

    this.getAppSummaryLink = getAppSummaryLink;
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

    function stMiddleware(tableState) {
      var stSort = tableState.sort.predicate + '_' + !tableState.sort.reverse;
      var sort = model.currentSortOption + '_' + model.sortAscending;
      if (stSort !== sort) {
        model.sortAscending = !tableState.sort.reverse;
        model.currentSortOption = tableState.sort.predicate;
      }
      tableState.pagination.numberOfPages = 1;
    }
  }

})();
