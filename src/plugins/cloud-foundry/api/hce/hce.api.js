(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.api.hce
   * @memberOf cloud-foundry.api
   * @name hce
   * @description Helion Code Engine API
   */
  angular
    .module('cloud-foundry.api')
    .run(registerHceApi);

  registerHceApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerHceApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.hce', new HceApi($http));
  }

  /**
   * @namespace cloud-foundry.api.hce.HceApi
   * @memberof cloud-foundry.api.hce
   * @name HceApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @class
   */
  function HceApi($http) {
    this.$http = $http;
  }

  angular.extend(HceApi.prototype, {

   /**
    * @function buildContainers
    * @memberof cloud-foundry.api.hce.HceApi
    * @description Get registered build container instances
    * @returns {promise}
    * @public
    */
    buildContainers: function () {
      return this.$http.get('/api/hce/v2/containers/images');
    },

    /**
    * @function notificationTargetTypes
    * @memberof cloud-foundry.api.hce.HceApi
    * @description Get the set of notification target types
    * @returns {promise}
    * @public
    */
    notificationTargetTypes: function () {
      return this.$http.get('/api/hce/v2/notifications/targets/types');
    }

  });

})();
