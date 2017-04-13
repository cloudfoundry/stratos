(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters', [
      'app.view.endpoints.clusters.cluster',
      'app.view.endpoints.clusters.tiles',
      'app.view.endpoints.clusters.router'
    ])
    .config(registerRoute)
    .run(register);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters', {
      url: '/cluster',
      abstract: true,
      template: '<ui-view/>',
      data: {
        activeMenuState: 'endpoint.clusters'
      }
    });
  }

  function register($q, $state, modelManager, appEventService, appUtilsService) {
    return new Clusters($q, $state, modelManager, appEventService, appUtilsService);
  }

  function Clusters($q, $state, modelManager, appEventService, appUtilsService) {

    var initialized = $q.defer();

    function init() {
      return initialized.promise;
    }

    appEventService.$on(appEventService.events.LOGIN, function () {
      onLoggedIn();
    });

    appUtilsService.chainStateResolve('endpoint.clusters', $state, init);

    function onLoggedIn() {
      var menu = modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('endpoint.clusters', 'endpoint.clusters.router', 'menu.cloud-foundry', 1, 'helion-icon-Cloud');
      initialized.resolve();
    }
  }

})();
