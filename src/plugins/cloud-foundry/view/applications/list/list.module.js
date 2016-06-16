(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list', [
      'cloud-foundry.view.applications.list.gallery-view',
      'cloud-foundry.view.applications.list.table-view'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.list', {
      url: '/list',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/list.html',
      controller: ApplicationsListController,
      controllerAs: 'applicationsListCtrl'
    });
  }

  ApplicationsListController.$inject = [
    'app.model.modelManager',
    'app.event.eventService'
  ];

  /**
   * @name ApplicationsListController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the event bus service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {app.event.eventService} eventService - the event bus service
   */
  function ApplicationsListController(modelManager, eventService) {
    var that = this;
    that.ready = false;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.eventService = eventService;
    this.hasApps = false;
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.userCnsiModel.list().then(function () {
      that.model.all().finally(function() {
        // Check the data we have and determine if we have any applications
        that.hasApps = false;
        if(that.model.data && that.model.data.applications) {
          var appCount = _.reduce(that.model.data.applications, function (sum, app) {
            if (!app.error && app.resources) {
              return sum + app.resources.length;
            } else {
              return sum;
            }
          }, 0);
          that.hasApps = (appCount > 0);
        }
        that.ready = true;
      });
    })
  }

  angular.extend(ApplicationsListController.prototype, {
  });

})();
