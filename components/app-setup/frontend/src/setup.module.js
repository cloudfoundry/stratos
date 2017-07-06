(function () {
  'use strict';

  angular
    .module('app-setup', ['app-setup.view'])
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
        hideAccount: true,
        hideBottomNavigation: true,
        hideSecondNavigation: true,
        error: ''
      }
    });
  }

  function registerSetup(consoleSetupCheck) {
    consoleSetupCheck.setupState = SETUP_STATE;
  }

  function setupController(appSetupService) {
    var vm = this;
    vm.startSetup = appSetupService.show;
  }

})();

