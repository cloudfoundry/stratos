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

  ApplicationsTableController.$inject = [];

  function ApplicationsTableController() {}

  angular.extend(ApplicationsTableController.prototype, {

    /**
     * @name getAppLink
     * @description Get link to application summary page
     * @param {object} app The application object
     * @returns {string} returns the link to the app summary page
     */
    getAppLink: function (app) {
      return '#/cf/applications/' + app.clusterId + '/app/' + app.metadata.guid + '/summary';
    }
  });

})();
