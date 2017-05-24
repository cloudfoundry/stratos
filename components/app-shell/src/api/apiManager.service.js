(function () {
  'use strict';

  angular
    .module('app.api')
    .factory('apiManager', apiManagerFactory);

  /**
   * @memberof app.api
   * @name apiManager
   * @description The manager that handles registration and retrieval of APIs
   * @returns {object} The API manager service
   */
  function apiManagerFactory() {
    var apis = {};

    return {
      apis: apis,
      register: register,
      retrieve: retrieve
    };

    function register(name, api) {
      apis[name] = api;
    }

    function retrieve(name) {
      return apis[name];
    }
  }

})();
