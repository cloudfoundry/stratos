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

  function register($location, modelManager, appEventService) {
    return new CloudFoundry($location, modelManager, appEventService);
  }

  function CloudFoundry($location, modelManager, appEventService) {
    appEventService.$on(appEventService.events.LOGIN, function (ev, preventRedirect) {
      _onLoggedIn(preventRedirect);
    });
    appEventService.$on(appEventService.events.LOGOUT, function () {
      _onLoggedOut();
    });

    function _onLoggedIn(preventRedirect) {
      _registerNavigation();
      // Only redirect if we are permitted
      if (!preventRedirect) {
        // Only redirect from the login page: preserve ui-context when reloading/refreshing in nested views
        if ($location.path() === '') {
          appEventService.$emit(appEventService.events.REDIRECT, 'cf.applications.list.gallery-view');
        }
      }
    }

    function _onLoggedOut() {
    }

    function _registerNavigation() {
      var menu = modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('cf.applications', 'cf.applications.list.gallery-view', 'menu.applications', 0, 'helion-icon-Application');
    }
  }
})();
