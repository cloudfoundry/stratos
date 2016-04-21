(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.services', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.services', {
      url: '/services',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/services/services.html',
      controller: ApplicationServicesController,
      controllerAs: 'applicationServicesCtrl'
    });
  }

  ApplicationServicesController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationServicesController
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry applications model
   * @property {string} id - the application GUID
   */
  function ApplicationServicesController(modelManager, $stateParams) {
    this.model = modelManager.retrieve('cloud-foundry.model.service');
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
    this.model.all();
    this.step = "instance";
    this.serviceActions = [
      {
        name: gettext('Detach'),
        execute: function (target) {
          /* eslint-disable */
          alert('Detach ' + target.entity.label);
          /* eslint-enable */
        }
      },
      {
        name: gettext('Manage Services'),
        execute: function (target) {
          /* eslint-disable */
          alert('Manage services for ' + target.entity.label);
          /* eslint-enable */
        }
      }
    ];
  }

  angular.extend(ApplicationServicesController.prototype, {
    /**
    * @name showServiceDetail
    * @param {object} service - the service to be displaye in the panel
    * @param {object} currentService - save the service clicked on
    * @property {object} flyoutActive - flyout panel boolean flag for visibility
    */
    showServiceDetail: function(service) {
      this.currentService = service;
      this.flyoutActive = true;
    },

    /**
    * @name addService
    * @description add this.currentService to this.appModel
    * @property {object} flyoutActive - flyout panel boolean flag for visibility
    */
    addService: function() {
      //TBD Addservice stuff
      // this.flyoutActive = false;
    },

    /**
    * @name cancelAddService
    * @description closes the flyout Panel without adding this.currentService to this.appModel
    * @property {object} flyoutActive - flyout panel boolean flag for visibility
    */
    cancelAddService: function() {
      this.flyoutActive = false;
    }
  });

})();
