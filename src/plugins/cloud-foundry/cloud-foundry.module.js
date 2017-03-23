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

  register.$inject = [
    '$state',
    '$location',
    'app.event.eventService',
    'modelManager',
    'app.view.notificationsService'
  ];

  function register($state, $location, eventService, modelManager, notificationService) {
    return new CloudFoundry($state, $location, eventService, modelManager, notificationService);
  }

  function CloudFoundry($state, $location, eventService, modelManager, notificationService) {
    var that = this;
    this.eventService = eventService;
    this.modelManager = modelManager;
    this.$state = $state;
    this.$location = $location;
    this.notificationService = notificationService;
    this.eventService.$on(this.eventService.events.LOGIN, function (ev, preventRedirect) {
      that.onLoggedIn(preventRedirect);
    });
    this.eventService.$on(this.eventService.events.LOGOUT, function () {
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
          this.eventService.$emit(this.eventService.events.REDIRECT, 'cf.applications.list.gallery-view');
        }
      }
    },

    onLoggedOut: function () {
    },

    registerNavigation: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('cf.applications', 'cf.applications.list.gallery-view', gettext('Applications'), 0, 'helion-icon-Application');
    }
  });

})();
