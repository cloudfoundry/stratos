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
    'app.model.modelManager'
  ];

  function register(eventService, modelManager) {
    new CloudFoundry(eventService, modelManager);
  }

  function CloudFoundry(eventService, modelManager) {
    this.eventService = eventService;
    this.modelManager = modelManager;
    this.init();
  }

  angular.extend(CloudFoundry.prototype, {
    init: function () {
      this.eventService.$on(this.eventService.events.LOGGED_IN, this.onLoggedIn.bind(this));
      this.eventService.$on(this.eventService.events.LOGGED_OUT, this.onLoggedOut.bind(this));
    },

    onLoggedIn: function () {
      this.registerNavigation();
    },

    onLoggedOut: function () {},

    registerNavigation: function () {
      this.modelManager.retrieve('app.model.navigation')
        .addMenuItem('cf.hosts', 'cf.hosts', gettext('Hosts'))
        .addMenuItem('cf.organizations', 'cf.organizations', gettext('Organizations'))
        .addMenuItem('cf.applications', 'cf.applications', gettext('Applications'))
        .addMenuItem('cf.services', 'cf.services', gettext('Services'));
    }
  });

})();
