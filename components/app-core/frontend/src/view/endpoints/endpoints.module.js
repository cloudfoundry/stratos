(function () {
  'use strict';

  angular
    .module('app.view.endpoints', [])
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
        label: 'endpoints',
        translate: true
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
    });

    appUtilsService.chainStateResolve('endpoint', $state, init);

  }

})();
