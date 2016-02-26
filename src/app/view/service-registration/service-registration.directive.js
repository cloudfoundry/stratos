(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('serviceRegistration', serviceRegistration);

  serviceRegistration.$inject = ['app.basePath'];

  /**
   * @namespace app.view.serviceRegistration
   * @memberof app.view
   * @name serviceRegistration
   * @description A service-registration directive
   * @param {string} path - the application base path
   * @returns {object} The service-registration directive definition object
   */
  function serviceRegistration(path) {
    return {
      bindToController: {
        showOverlayRegistration: '=?'
      },
      controller: ServiceRegistrationController,
      controllerAs: 'serviceRegistrationCtrl',
      scope: {},
      templateUrl: path + 'view/service-registration/service-registration.html'
    };
  }

  ServiceRegistrationController.$inject = [
    'app.event.eventService',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.ServiceRegistrationController
   * @memberof app.view
   * @name ServiceRegistrationController
   * @constructor
   * @param {app.event.eventService} eventService - the application event bus
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.account} account - the account model
   * @property {app.event.eventService} eventService - the application event bus
   * @property {boolean} showRegistration - flag to show or hide this component
   * @property {number} servicesRegistered - the count of valid clusters/services registered
   * @property {array} services - the clusters/services available for registration
   */
  function ServiceRegistrationController(eventService, modelManager) {
    this.account = modelManager.retrieve('app.model.account');
    this.eventService = eventService;
    this.overlay = angular.isDefined(this.showOverlayRegistration);

    // TODO: hardcoding services for now until backend is ready
    this.servicesRegistered = 0;
    this.services = [
      { name: 'AWS', url: 'api.15.126.233.29.xip.io' },
      { name: 'Github', url: 'api.15.126.233.30.xip.io' },
      { name: 'Helion_Cloud_foundry_01', url: 'api.15.126.233.28.xip.io' }
    ];

    this.showFlyout = false;
  }

  // Mock out the enter credentials and unregister actions
  angular.extend(ServiceRegistrationController.prototype, {
    closeFlyout: function (serviceData) {
      // update service data if new data available
      if (angular.isDefined(serviceData)) {
        angular.extend(this.activeService, serviceData);
      }

      this.showFlyout = false;
      this.servicesRegistered = countRegistered(this.services);
    },
    completeRegistration: function () {
      this.showOverlayRegistration = false;
    },
    enterCredentials: function (service) {
      this.activeService = service;
      this.showFlyout = true;
    },
    unregister: function (service) {
      service.registered = false;
      delete service.username;
      this.servicesRegistered = countRegistered(this.services);
    }
  });

  function countRegistered(services) {
    return _.reduce(services,
      function (sum, obj) {
        if (obj.registered) {
          sum += 1;
        }
        return sum;
      }, 0);
  }

})();
