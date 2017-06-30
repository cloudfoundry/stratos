(function () {
  'use strict';

  angular
    .module('cloud-foundry', [
      'cloud-foundry.api',
      'cloud-foundry.event',
      'cloud-foundry.model',
      'cloud-foundry.view',
      'cloud-foundry.service'
    ])
    .run(register);

  function register(appEventService, modelManager) {
    return new CloudFoundry(appEventService, modelManager);
  }

  function CloudFoundry(appEventService, modelManager) {
    appEventService.$on(appEventService.events.LOGIN, function (ev, preventRedirect) {
      onLoggedIn(preventRedirect);
    });
    appEventService.$on(appEventService.events.LOGOUT, function () {
      onLoggedOut();
    });

    function onLoggedIn() {
      registerNavigation();
    }

    function onLoggedOut() {
    }

    function registerNavigation() {
      var menu = modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('cf.applications', 'cf.applications.list.gallery-view', 'menu.applications', 0, 'apps');
    }
  }

})();
