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
    // The console will navigate to this state when it detects setup is required (instead of the default error page)
    consoleSetupCheck.setupState = SETUP_STATE;
  }

})();

