(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application', [
      'cloud-foundry.view.applications.application.summary',
      'cloud-foundry.view.applications.application.services'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application', {
      url: '/:guid',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/application.html',
      controller: ApplicationController,
      controllerAs: 'appCtrl'
    });
  }

  ApplicationController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   * @property {number} tabIndex - index of active tab
   */
  function ApplicationController(modelManager, $stateParams) {

    // state mapping key === this.model.appStateSwitchTo + '_' + this.model.summary.state

    // TODO: 1) need to find the right icon name. 2) use spinner for loading
    this.stateMap = {
      'LOADING': {
        className: 'app-loading',
        icon: 'helion-icon helion-icon-Refresh'
      },

      'STARTED_PENDING': {
        className: 'app-starting',
        icon: 'helion-icon helion-icon-Tab_Carrot'
      },

      'STOPPED_PENDING': {
        className: 'app-stopping',
        icon: 'helion-icon helion-icon-Halt_Stop'
      },

      'STARTED': {
        className: 'app-started',
        icon: 'helion-icon helion-icon-Checkmark'
      },

      'STOPPED': {
        className: 'app-stopped',
        icon: 'helion-icon helion-icon-Halt_Stop'
      },

      'FAILED': {
        className: 'app-error',
        icon: 'helion-icon helion-icon-Critical'
      }
    };

    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
    this.init();
  }

  angular.extend(ApplicationController.prototype, {
    init: function () {
      this.model.getAppSummary(this.id);
    }
  });

})();
