(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.api
   * @memberOf cloud-foundry.api
   * @name cloud-foundry.api.service
   * @description Cloud Foundry services access API
   */
  angular
    .module('cloud-foundry.api')
    .run(registerServiceApi);

  registerServiceApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerServiceApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.service', new ServiceApi($http));
  }

  /**
   * @namespace cloud-foundry.api
   * @memberof cloud-foundry.api.service
   * @name cloud-foundry.api.service.ServiceApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function ServiceApi($http) {
    this.$http = $http;
  }

  angular.extend(ServiceApi.prototype, {

   /**
    * @function all
    * @memberof cloud-foundry.api.service
    * @description Retrieve all the services from cloud foundry.
    * @returns {promise} a promise object
    * @public
    */
    all: function () {
      return this.$http.get('/api/cf/v2/services');
    },

   /**
    * @function summary
    * @memberof cloud-foundry.api.service
    * @description Retrieve summary of service with given app id
    * @param {string} guid - the service id
    * @returns {promise} a promise object
    * @public
    */
    summary: function (guid) {
      return this.$http.get('/api/cf/v2/services/' + guid);
    }

  });

})();
