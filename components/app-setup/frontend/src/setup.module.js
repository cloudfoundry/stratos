(function () {
  'use strict';

  angular
    .module('app-setup', [
      'app-setup.view',
      'app-setup.api',
      'app-setup.model'
    ])
    .config(registerState)
    .run(registerSetup);

  var SETUP_STATE = 'setup';

  function registerState($stateProvider) {

    $stateProvider.state(SETUP_STATE, {
      url: '/setup',
      templateUrl: 'plugins/app-setup/view/setup.html',
      controller: setupController,
      controllerAs: 'setupController',
      params: {
        hideNavigation: true,
        hideAccount: true
      }
    });
  }

  function registerSetup(consoleSetupCheck) {
    consoleSetupCheck.setupState = SETUP_STATE;
  }

  function setupController(appSetupWizardService) {
    var vm = this;
    vm.startSetup = appSetupWizardService.show;
  }

})();

