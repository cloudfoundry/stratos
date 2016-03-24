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
    this.serviceActions = [
      {
        name: 'Detach',
        execute: function (target) {
          /* eslint-disable */
          alert('Detach ' + target.entity.label);
          /* eslint-enable */
        }
      },
      {
        name: 'Manage Services',
        execute: function (target) {
          /* eslint-disable */
          alert('Manage services for ' + target.entity.label);
          /* eslint-enable */
        }
      }
    ];
  }

  angular.extend(ApplicationServicesController.prototype, {
  });

})();
