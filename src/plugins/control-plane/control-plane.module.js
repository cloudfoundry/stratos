(function () {
  'use strict';

  angular
    .module('control-plane', [
      'control-plane.api',
      'control-plane.model',
      'control-plane.view'
    ])
    .run(register);

  register.$inject = [
    'app.event.eventService',
    'app.model.modelManager',
    'app.view.notificationsService'
  ];

  function register(eventService, modelManager) {
    return new ControlPlane(eventService, modelManager);
  }

  function ControlPlane(eventService, modelManager) {
    var that = this;
    this.eventService = eventService;
    this.modelManager = modelManager;
    this.eventService.$on(this.eventService.events.LOGIN, function (ev, preventRedirect) {
      that.onLoggedIn(preventRedirect);
    });

    this.eventService.$on(this.eventService.events.ENDPOINT_CONNECT_CHANGE, function () {
      that.update();
    });
  }

  angular.extend(ControlPlane.prototype, {

    update: function (services) {
      var userServices = this.modelManager.retrieve('app.model.serviceInstance.user');
      services = services || userServices.serviceInstances;
      var hcpServices = _.filter(services, {cnsi_type: 'hcp'});
      this.menuItem.hidden = hcpServices.length === 0;
    },

    onLoggedIn: function () {
      this.registerNavigation();
      this.update();
    },

    registerNavigation: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      this.menuItem = menu.addMenuItem('cp.list', 'cp.list', gettext('Control Plane'), 1, 'helion-icon-Resources');
      //
      // Hide to start with until we know if we have HCP instances connected
      this.menuItem.hidden = true;
    }
  });

})();
