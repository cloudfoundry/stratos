(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.api
   * @memberOf cloud-foundry.api
   * @name cloud-foundry.api.application
   * @description Cloud Foundry applications access API
   */
  angular
    .module('cloud-foundry.api')
    .run(registerApplicationApi);

  registerApplicationApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerApplicationApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.application', new ApplicationApi($http));
  }

  /**
   * @namespace cloud-foundry.api
   * @memberof cloud-foundry.api.application
   * @name cloud-foundry.api.application.ApplicationApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function ApplicationApi($http) {
    this.$http = $http;
  }

  angular.extend(ApplicationApi.prototype, {

   /**
    * @function all
    * @memberof cloud-foundry.api.application
    * @description Retrieve all the applications from cloud foundry.
    * @returns {promise}
    * @public
    */
    all: function () {
      return this.$http.get('/api/cf/v2/apps');
    },

   /**
    * @function summary
    * @memberof cloud-foundry.api.application
    * @description Retrieve summary of application with given app id
    * @param {string} guid - the application id
    * @returns {promise}
    * @public
    */
    summary: function (guid) {
      return this.$http.get('/api/cf/v2/apps/' + guid + '/summary');
    }

  });

})();
