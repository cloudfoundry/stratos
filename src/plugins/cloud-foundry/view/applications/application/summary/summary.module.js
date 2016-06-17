(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.summary', {
      url: '/summary',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/summary/summary.html',
      controller: ApplicationSummaryController,
      controllerAs: 'applicationSummaryCtrl'
    });
  }

  ApplicationSummaryController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    'cloud-foundry.view.applications.application.summary.addRoutes'

  ];

  /**
   * @name ApplicationSummaryController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationSummaryController(modelManager, $stateParams, addRoutesService) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.id = $stateParams.guid;
    this.addRoutesService = addRoutesService;
    this.userCnsiModel.list();
  }

  angular.extend(ApplicationSummaryController.prototype, {
    /**
     * @function isWebLink
     * @description Determine if supplies buildpack url is a web link
     * @param {string} buildpack - buildpack url guid
     * @returns {boolean} Indicating if supplies buildpack is a web link
     * @public
     **/
    isWebLink: function(buildpack) {
      var url = angular.isDefined(buildpack) && buildpack !== null ? buildpack : '';
      url = url.trim().toLowerCase();
      return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
    },

    /**
     * @function showAddRouteForm
     * @description Show Add a Route form
     * @public
     **/
    showAddRouteForm: function() {
      this.addRoutesService.add();
    }
  });

})();
