(function () {
  'use strict';

  // angular
  //   .module('service-manager', [
  //     'cloud-foundry.api',
  //     'cloud-foundry.event',
  //     'cloud-foundry.model',
  //     'cloud-foundry.view'
  //   ])
  //   .run(register);

  angular
    .module('service-manager', [
      'service-manager.api',
      'service-manager.view',
      'service-manager.model'
    ])
    .run(register);

  register.$inject = [
    '$state',
    '$location',
    'app.event.eventService',
    'app.model.modelManager',
    'app.view.notificationsService'
  ];

  function register($state, $location, eventService, modelManager, notificationService) {
    return new ServiceManager($state, $location, eventService, modelManager, notificationService);
  }

  function ServiceManager($state, $location, eventService, modelManager, notificationService) {
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

    this.eventService.$on(this.eventService.events.ENDPOINT_CONNECT_CHANGE, function () {
      that.update();
    });
  }

  angular.extend(ServiceManager.prototype, {
    update: function (services) {
      var that = this;
      // Check to see if we have any services
      var userServices = this.modelManager.retrieve('app.model.serviceInstance.user');
      services = services || userServices.serviceInstances;
      var hsmServices = _.filter(services, {cnsi_type: 'hsm'});
      this.menuItem.hidden = hsmServices.length === 0;
      if (!this.menuItem.hidden) {
        var smModel = this.modelManager.retrieve('service-manager.model');
        smModel.checkForUpgrades().then(function (upgrades) {
          that.setUpgradesAvailable(upgrades);
        });
      }
    },
    onLoggedIn: function () {
      this.registerNavigation();
      this.update();
    },

    setUpgradesAvailable: function (upgrades) {
      if (upgrades > 0) {
        this.menuItem.badge = {
          value: upgrades
        };
      } else {
        delete this.menuItem.badge;
      }
    },

    onLoggedOut: function () {
    },

    registerNavigation: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      this.menuItem = menu.addMenuItem('sm.list', 'sm.list', gettext('Service Manager'), 1, 'helion-icon-System');
      //
      // Hide to start with until we know if we have HSM Services connected
      this.menuItem.hidden = true;
    }
  });

})();
