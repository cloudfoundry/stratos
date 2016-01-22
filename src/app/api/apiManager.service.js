(function () {
  'use strict';

  angular
    .module('app.api')
    .factory('app.api.apiManager', apiManagerFactory);

  /**
   * @memberof app.api
   * @name apiManager
   * @description The API layer of the UI platform that handles
   * HTTP requests
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
