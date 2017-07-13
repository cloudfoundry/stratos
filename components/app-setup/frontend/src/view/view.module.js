(function () {
  'use strict';

  angular
    .module('app-setup.view', [ ])
    .config(registerState)
    .run(registerSetup);

  var SETUP_STATE = 'setup';

  function registerState($stateProvider) {

    $stateProvider.state(SETUP_STATE, {
      url: '/setup',
      templateUrl: 'plugins/app-setup/view/setup.html',
      params: {
        hideNavigation: true,
        hideAccount: true
      }
    });
  }

  function registerSetup(consoleSetupCheck) {
    // Apply a setup up state so the console knows to come here when it's not setup
    consoleSetupCheck.setupState = SETUP_STATE;
  }

})();

