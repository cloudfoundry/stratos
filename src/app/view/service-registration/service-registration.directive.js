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
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.ServiceRegistrationController
   * @memberof app.view
   * @name ServiceRegistrationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {boolean} overlay - flag to show or hide this component
   * @property {app.model.serviceInstance} serviceInstanceModel - the service instance model
   * @property {array} serviceInstances - the service instances available to user
   * @property {boolean} showFlyout - flag to show or hide flyout
   */
  function ServiceRegistrationController(modelManager) {
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstances = this.serviceInstanceModel.serviceInstances;
    this.showFlyout = false;
  }

  angular.extend(ServiceRegistrationController.prototype, {
    closeFlyout: function (serviceInstance) {
      if (angular.isDefined(serviceInstance)) {
        // save service instance data only on successful registration
        angular.extend(this.activeServiceInstance, serviceInstance);

        if (serviceInstance.registered) {
          this.serviceInstanceModel.numRegistered += 1;
        }
      }

      this.showFlyout = false;
    },
    completeRegistration: function () {
      this.showOverlayRegistration = false;
    },
    enterCredentials: function (serviceInstance) {
      this.activeServiceInstance = serviceInstance;
      this.showFlyout = true;
    },
    unregister: function (serviceInstance) {
      var that = this;
      this.serviceInstanceModel.unregister(serviceInstance.name)
        .then(function success() {
          serviceInstance.registered = false;
          delete serviceInstance.service_user;
          that.serviceInstanceModel.numRegistered -= 1;
        });
    }
  });

})();
