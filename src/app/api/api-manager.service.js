(function () {
  'use strict';

  angular
    .module('app.api')
    .factory('app.api.api-manager', apiManagerFactory);

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
