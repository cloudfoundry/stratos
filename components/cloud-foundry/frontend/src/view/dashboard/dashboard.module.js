(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard', [
      'cloud-foundry.view.dashboard.cluster',
      'cloud-foundry.view.dashboard.tiles',
      'cloud-foundry.view.dashboard.router'
    ])
    .config(registerRoute)
    .run(register);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters', {
      url: '/cf',
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
      menu.addMenuItem('endpoint.clusters', 'endpoint.clusters.router', 'menu.cloud-foundry', undefined, 1, 'cloud_queue');
      initialized.resolve();
    }
  }

})();
