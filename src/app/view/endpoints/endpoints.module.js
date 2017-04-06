(function () {
  'use strict';

  angular
    .module('app.view.endpoints', [
      'app.view.endpoints.clusters',
      'app.view.endpoints.dashboard'
    ])
    .config(registerRoute)
    .run(register);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint', {
      url: '/endpoint',
      abstract: true,
      template: '<ui-view/>',
      data: {
        activeMenuState: 'endpoints'
      },
      ncyBreadcrumb: {
        label: gettext('Endpoints')
      }
    });
  }

  function register($q, $state, modelManager, appEventService, appUtilsService) {
    return new Endpoints($q, $state, modelManager, appEventService, appUtilsService);
  }

  function Endpoints($q, $state, modelManager, appEventService, appUtilsService) {
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
      menu.addMenuItem('endpoints', 'endpoint.dashboard', gettext('Endpoints'), 2, 'helion-icon-Inherit helion-icon-r270');
      initialized.resolve();
    }

  }

})();
