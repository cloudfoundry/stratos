(function () {
  'use strict';

  angular
    .module('cloud-foundry', [
      'cloud-foundry.api',
      'cloud-foundry.event',
      'cloud-foundry.model',
      'cloud-foundry.view'
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
    onLoggedIn: function (preventRedirect) {
      this.registerNavigation();
      // Only redirect if we are permitted
      if (!preventRedirect) {
        // Only redirect from the login page: preserve ui-context when reloading/refreshing in nested views
        if (this.$location.path() === '') {
          this.appEventService.$emit(this.appEventService.events.REDIRECT, 'cf.applications.list.gallery-view');
        }
      }
    },

    onLoggedOut: function () {
    },

    registerNavigation: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('cf.applications', 'cf.applications.list.gallery-view', 'menu.applications', 0, 'helion-icon-Application');
    }
  });

})();
