(function () {
  'use strict';

  angular
    .module('endpoints-dashboard', [])
    .constant('endpointDashboardConfigKey', 'endpointsDashboard')
    .run(register);

  function register($q, $state, modelManager, appEventService, appUtilsService,
                    endpointDashboardConfigKey, appLoggedInService) {
    return new EndpointsDashboard($q, $state, modelManager, appEventService, appUtilsService,
      endpointDashboardConfigKey, appLoggedInService);
  }

  function EndpointsDashboard($q, $state, modelManager, appEventService, appUtilsService, endpointDashboardConfigKey,
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
      if (config.enable) {
        return 'endpoint.dashboard';
      }
      delete env.plugins.endpointsDashboard;
    }

    function updateConfig() {
      var info = modelManager.retrieve('app.model.consoleInfo').info;
      config = _.get(info, 'plugin-config.' + endpointDashboardConfigKey, {});
      config = angular.fromJson(config);
    }
  }

})();

