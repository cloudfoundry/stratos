(function () {
  'use strict';

  angular
    .module('app.service')
    .factory('app.service.serviceManager', serviceManagerFactory);

  serviceManagerFactory.$inject = [];

  /**
   * @namespace app.service.serviceManager
   * @memberof app.service
   * @name app.service.serviceManager
   * @description The manager that handles registration and retrieval of services
   * @returns {object} The service manager service
   */
  function serviceManagerFactory() {
    var services = {};

    return {
      services: services,
      register: register,
      retrieve: retrieve
    };

    /**
     * @function register
     * @memberof app.service
     * @param {string} name - the name of the service to register
     * @param {object} service - the service object to register
     */
    function register(name, service) {
      services[name] = service;
    }

    /**
     * @function retrieve
     * @memberof app.service
     * @param {string} name - the name of the service to retrieve
     * @returns {object} the requested service
     */
    function retrieve(name) {
      return services[name];
    }
  }

})();
