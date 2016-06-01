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
    'app.event.eventService',
    'app.model.modelManager',
    '$state',
    '$location'
  ];

  function register(eventService, modelManager, $state, $location) {
    return new CloudFoundry(eventService, modelManager, $state, $location);
  }

  function CloudFoundry(eventService, modelManager, $state, $location) {
    var that = this;
    this.eventService = eventService;
    this.modelManager = modelManager;
    this.$state = $state;
    this.$location = $location;
    this.eventService.$on(this.eventService.events.LOGIN, function () {
      that.onLoggedIn();
    });
    this.eventService.$on(this.eventService.events.LOGOUT, function () {
      that.onLoggedOut();
    });
  }

  angular.extend(CloudFoundry.prototype, {
    onLoggedIn: function () {
      this.registerNavigation();

      // Only redirect from the login page: preserve ui-context when reloading/refreshing in nested views
      if (this.$location.path() === '') {
        this.eventService.$emit(this.eventService.events.REDIRECT, 'cf.applications.list.gallery-view');
      } else if (this.$state.current.name !== '') {
        // If $location.path() is not empty and the state is set, ui-router won't reload for us
        // We reload manually to trigger any $stateChangeSuccess logic

        // N.B we only reach this after pasting a deep URL in a new tab from a non-loggedIn state
        this.$state.reload();
      }
    },

    onLoggedOut: function () {},

    registerNavigation: function () {
      this.modelManager.retrieve('app.model.navigation').menu
        .addMenuItem('cf.applications', 'cf.applications.list.gallery-view', gettext('Applications'));
    }
  });

})();
