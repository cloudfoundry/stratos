(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.api
   * @memberOf cloud-foundry.api
   * @name cloud-foundry.api
   * @description Cloud Foundry v2 API
   */
  angular
    .module('cloud-foundry.api')
    .run(registerCFApi);

  registerCFApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerCFApi($http, apiManager) {
    apiManager.register('cloud-foundry.api', new CloudFoundryApi($http));
  }

  /**
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function CloudFoundryApi($http) {
    this.$http = $http;
  }

  angular.extend(CloudFoundryApi.prototype, {
  });

})();
