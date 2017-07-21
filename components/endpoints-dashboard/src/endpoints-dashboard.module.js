(function () {
  'use strict';

  angular
    .module('endpoints-dashboard', [])
    .run(register);

  function register($q, $state, modelManager, appEventService, appUtilsService) {
    return new EndpointsDashboard($q, $state, modelManager, appEventService, appUtilsService);
  }

  function EndpointsDashboard($q, $state, modelManager, appEventService, appUtilsService) {
    var initialized = $q.defer();

    function init() {
      return initialized.promise;
    }

    appEventService.$on(appEventService.events.LOGIN, function () {
      onLoggedIn();
    });

    appUtilsService.chainStateResolve('endpoint', $state, init);

    function onLoggedIn() {
      var menu = modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('endpoints', 'endpoint.dashboard', 'menu.endpoints', undefined, 2, 'settings_input_component');
      initialized.resolve();
    }
  }

})();

