(function () {
  'use strict';

  angular
    .module('cf-versions', [
      'cloud-foundry',
      'cf-versions.api',
      'cf-versions.model',
      'cf-versions.view'
    ])
    .run(register);

  function register($state, $location, appEventService, modelManager, appNotificationsService) {
    return new CloudFoundry($state, $location, appEventService, modelManager, appNotificationsService);
  }

  function CloudFoundry($state, $location, appEventService, modelManager, appNotificationsService) {
    var that = this;
    this.appEventService = appEventService;
    this.modelManager = modelManager;
    this.$state = $state;
    this.$location = $location;
    this.appNotificationsService = appNotificationsService;
    this.appEventService.$on(this.appEventService.events.LOGIN, function (ev, preventRedirect) {
      that.onLoggedIn(preventRedirect);
    });
    this.appEventService.$on(this.appEventService.events.LOGOUT, function () {
      that.onLoggedOut();
    });
  }

  angular.extend(CloudFoundry.prototype, {
    onLoggedIn: function () {
      this.registerNavigation();
    },

    onLoggedOut: function () {
    },

    registerNavigation: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('cf.applications', 'cf.applications.list.gallery-view', 'menu.applications', 0, 'apps');
    }
  });

})();
