(function () {
  'use strict';

  angular
    .module('app-examples', [
      'app',
      'app-examples.main'
    ])
    .run(register);

  function register($state, $location, appEventService, modelManager, loginManager) {
    return new AppExamples($state, $location, appEventService, modelManager, loginManager);
  }

  function AppExamples($state, $location, appEventService, modelManager, loginManager) {
    var that = this;
    this.appEventService = appEventService;
    this.modelManager = modelManager;
    this.$state = $state;
    this.$location = $location;
    this.appEventService.$on(this.appEventService.events.LOGIN, function (ev, preventRedirect) {
      that.onLoggedIn(preventRedirect);
    });
    this.appEventService.$on(this.appEventService.events.LOGOUT, function () {
      that.onLoggedOut();
    });

    loginManager.setEnabled(false);
  }

  angular.extend(AppExamples.prototype, {
    onLoggedIn: function () {
      this.registerNavigation();
    },

    onLoggedOut: function () {
    },

    registerNavigation: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('examples', 'examples', 'menu.examples', 0, 'dvr');

      menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('theme', 'theme', 'menu.theme', 1, 'visibility');
    }
  });

})();
