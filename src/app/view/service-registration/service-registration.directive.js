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
   * @property {app.model.user} userModel - the user model
   * @property {array} serviceInstances - the service instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   */
  function ServiceRegistrationController(modelManager) {
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.userModel = modelManager.retrieve('app.model.user');
    this.serviceInstances = this.serviceInstanceModel.serviceInstances;
    this.warningMsg = gettext('Authentication failed, please try reconnect.');
    this.serviceInstanceModel.list();
  }

  angular.extend(ServiceRegistrationController.prototype, {
    /**
     * @function completeRegistration
     * @memberOf app.view.ServiceRegistrationController
     * @description Set service instances as registered
     * @returns {void}
     */
    completeRegistration: function () {
      var that = this;
      if (this.serviceInstanceModel.numValid > 0) {
        this.userModel.updateRegistered(true)
          .then(function () {
            that.showOverlayRegistration = false;
          });
      }
    },

    /**
     * @function connect
     * @memberOf app.view.ServiceRegistrationController
     * @description Connect service instance for user
     * @param {object} serviceInstance - the service instance to connect
     * @returns {void}
     */
    connect: function (serviceInstance) {
      var that = this;
      this.serviceInstanceModel.connect(serviceInstance.url)
        .then(function success(response) {
          angular.extend(serviceInstance, response.data);
          serviceInstance.valid = true;
          that.serviceInstanceModel.numValid += 1;
        });
    },

    /**
     * @function disconnect
     * @memberOf app.view.ServiceRegistrationController
     * @description Disconnect service instance for user
     * @param {object} serviceInstance - the service instance to disconnect
     * @returns {void}
     */
    disconnect: function (serviceInstance) {
      var that = this;
      this.serviceInstanceModel.disconnect(serviceInstance.id)
        .then(function success() {
          delete serviceInstance.account;
          delete serviceInstance.expires_at;
          delete serviceInstance.valid;
          that.serviceInstanceModel.numValid -= 1;
        });
    },

    /**
     * @function isEmpty
     * @memberOf app.view.ServiceRegistrationController
     * @description Check to see if this controller has any serviceInstances
     * @returns {boolean}
     */
    isEmpty: function () {
      return this.serviceInstances.length === 0;
    }
  });

})();
