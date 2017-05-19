(function () {
  'use strict';

  /**
   * @namespace app.view
   * @memberof app
   * @name view
   * @description The view layer of the UI platform that contains
   * the Angular directives and controllers
   */
  angular
    .module('app.view', [
      'app.view.endpoints',
      'app.view.error-page',
      'app.utils'
    ])
    .run(register);

  function register($location, appEventService) {
    appEventService.$on(appEventService.events.LOGIN, function (ev, preventRedirect) {
      onLoggedIn(preventRedirect);
    });

    function onLoggedIn(preventRedirect) {
      // Only redirect if we are permitted
      if (!preventRedirect) {
        // Only redirect from the login page: preserve ui-context when reloading/refreshing in nested views
        if ($location.path() === '') {
          appEventService.$emit(appEventService.events.REDIRECT, findMain());
        }
      }
    }

    function findMain() {
      var p = _.find(env.plugins, {moduleName: env.main});
      var main = 'account-settings';
      main = p && p.main ? p.main : main;
      return main;
    }
  }

})();
