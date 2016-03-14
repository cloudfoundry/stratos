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
   */
  function ServiceRegistrationController(modelManager) {
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstances = this.serviceInstanceModel.serviceInstances;
    this.warningMsg = gettext('Authentication Failed, please try reconnect.');
  }

  angular.extend(ServiceRegistrationController.prototype, {
    completeRegistration: function () {
      var that = this;

      if (this.serviceInstanceModel.numRegistered > 0) {
        var registered = _.filter(this.serviceInstances, { valid: true });
        this.serviceInstanceModel.register(registered)
          .then(function () {
            that.showOverlayRegistration = false;
          });
      }
    },
    connect: function (serviceInstance) {
      var that = this;

      // Mock data from UAA server
      var now = (new Date()).getTime() / 1000;
      serviceInstance.service_user = serviceInstance.name + '_user';
      serviceInstance.service_token = 'token';
      serviceInstance.expires_at = now + 60;
      serviceInstance.scope = 'role1 role2';

      this.serviceInstanceModel.connect(serviceInstance)
        .then(function success() {
          serviceInstance.valid = true;
          that.serviceInstanceModel.numRegistered += 1;
        });
    },
    disconnect: function (serviceInstance) {
      var that = this;
      this.serviceInstanceModel.disconnect(serviceInstance.name)
        .then(function success() {
          delete serviceInstance.registered;
          delete serviceInstance.valid;
          delete serviceInstance.service_user;
          delete serviceInstance.service_token;
          delete serviceInstance.expires_at;
          delete serviceInstance.scope;
          that.serviceInstanceModel.numRegistered -= 1;
        });
    }
  });

})();
