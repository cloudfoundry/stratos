(function () {
  'use strict';

  /**
   * @namespace app.api.serviceInstance
   * @memberof app.api
   * @name serviceInstance
   * @description Service instance API
   */
  angular
    .module('app.api')
    .run(registerServiceInstanceApi);

  function registerServiceInstanceApi($http, $httpParamSerializer, apiManager) {
    apiManager.register('app.api.serviceInstance',
      new ServiceInstanceApi($http, $httpParamSerializer));
  }

  /**
   * @namespace app.api.serviceInstance.ServiceInstanceApi
   * @memberof app.api.serviceInstance
   * @name ServiceInstanceApi
   * @param {object} $http - the Angular $http service
   * @param {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @property {object} $http - the Angular $http service
   * @property {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @class
   */
  function ServiceInstanceApi($http, $httpParamSerializer) {
    this.$http = $http;
    this.$httpParamSerializer = $httpParamSerializer;

    return {
      create: create,
      remove: remove,
      list: list
    };

    /**
     * @function create
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Create a service instance
     * @param {string} url - the service instance endpoint
     * @param {string} name - the service instance friendly name
     * @param {boolean} skipSslValidation - whether to skip SSL validation for this endpoint
     * @param {string} serviceType - the type of the service instance to create
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function create(url, name, skipSslValidation, serviceType) {
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      serviceType = serviceType || 'hcf';
      var data = $httpParamSerializer({
        api_endpoint: url,
        cnsi_name: name,
        skip_ssl_validation: skipSslValidation
      });
      return $http.post('/pp/v1/register/' + serviceType, data, config);
    }

    /**
     * @function remove
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Remove service instance
     * @param {number} guid - the ID of the service instance to remove
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function remove(guid) {
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var removalData = {cnsi_guid: guid};
      var data = $httpParamSerializer(removalData);
      /* eslint-disable */
      // TODO(woodnt): This should likely be a delete.  We should investigate the Portal-proxy urls and verbs. https://jira.hpcloud.net/browse/TEAMFOUR-620
      /* eslint-enable */
      return $http.post('/pp/v1/unregister', data, config);
    }

    /**
     * @function list
     * @memberof app.api.serviceInstance.ServiceInstanceApi
     * @description Returns a list of service instances (master list)
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function list() {
      return $http.get('/pp/v1/cnsis');
    }
  }

})();
