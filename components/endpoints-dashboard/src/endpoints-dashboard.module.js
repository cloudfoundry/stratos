(function () {
  'use strict';

  angular
    .module('endpoints-dashboard', [])
    .constant('endpointsDashboardDisabledKey', 'endpointsDashboardDisabled')
    .run(register);

  function register($q, $state, modelManager, appEventService, appUtilsService,
                    endpointsDashboardDisabledKey, appLoggedInService) {
    return new EndpointsDashboard($q, $state, modelManager, appEventService, appUtilsService,
      endpointsDashboardDisabledKey, appLoggedInService);
  }

  function EndpointsDashboard($q, $state, modelManager, appEventService, appUtilsService, endpointsDashboardDisabledKey,
                              appLoggedInService) {
    var initialized = $q.defer();

    var config = {};

    appLoggedInService.setDashboardRedirect(getDashboardRedirect);

    appEventService.$on(appEventService.events.LOGIN, function () {
      if (!config.disable) {
        onLoggedIn();
      }
    });

    appUtilsService.chainStateResolve('endpoint', $state, init);

    function init() {
      return initialized.promise;
    }

    function onLoggedIn() {
      var menu = modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('endpoints', 'endpoint.dashboard', 'menu.endpoints', 2, 'settings_input_component');
      initialized.resolve();
    }

    function getDashboardRedirect() {
      updateConfig();
      if (config.disable) {
        delete env.plugins.endpointsDashboard;
      } else {
        return 'endpoint.dashboard';
      }
    }

    function updateConfig() {
      var info = modelManager.retrieve('app.model.consoleInfo').info;
      config.disable = _.get(info, 'plugin-config.' + endpointsDashboardDisabledKey) === 'true';
    }
  }

})();

