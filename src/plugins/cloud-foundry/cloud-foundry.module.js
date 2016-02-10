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
    return new CloudFoundry(eventService, modelManager);
  }

  function CloudFoundry(eventService, modelManager) {
    var that = this;
    this.eventService = eventService;
    this.modelManager = modelManager;
    this.eventService.$on(this.eventService.events.LOGGED_IN, function () {
      that.onLoggedIn();
    });
    this.eventService.$on(this.eventService.events.LOGGED_OUT, function () {
      that.onLoggedOut();
    });
  }

  angular.extend(CloudFoundry.prototype, {
    onLoggedIn: function () {
      this.registerNavigation();
      this.eventService.$emit(this.eventService.events.AUTO_NAV, 'cf.applications');
    },

    onLoggedOut: function () {},

    registerNavigation: function () {
      this.modelManager.retrieve('app.model.navigation').menu
        .addMenuItem('cf.hosts', 'cf.hosts', gettext('Hosts'))
        .addMenuItem('cf.organizations', 'cf.organizations', gettext('Organizations'))
        .addMenuItem('cf.applications', 'cf.applications', gettext('Applications'))
        .addMenuItem('cf.services', 'cf.services', gettext('Services'));
    }
  });

})();
