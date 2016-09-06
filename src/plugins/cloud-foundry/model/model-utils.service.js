(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   */
  angular
    .module('cloud-foundry.model')
    .factory('cloud-foundry.model.modelUtils', modelUtilsServiceFactory);

  modelUtilsServiceFactory.$inject = [
    '$q',
    '$http'
  ];

  /**
   * @function modelUtilsServiceFactory
   * @memberof cloud-foundry.model
   * @param {object} $q - The Angular $q service
   * @param {object} $http - The Angular $http service
   * @description Service to provide utils for CF models
   * @returns {object} The Model Utils Service
   */
  function modelUtilsServiceFactory($q, $http) {

    return {
      makeListParams: makeListParams,
      makeHttpConfig: makeHttpConfig,
      dePaginate: dePaginate
    };

    /**
     * @function makeHttpConfig
     * @memberof cloud-foundry.model.modelUtils
     * @description Creates the http config for a portal proxy request to an individual CNSI. This uses CNSI passthrough
     * @param {object} cnsiGuid - the CNSI target to make request to.
     * @returns {object} the $http service http config
     */
    function makeHttpConfig(cnsiGuid) {
      var headers = {'x-cnap-cnsi-list': cnsiGuid};
      // Add passthrough header
      angular.extend(headers, {
        'x-cnap-passthrough': 'true'
      });
      return {
        headers: headers
      };
    }

    /**
     * @function makeListParams
     * @memberof cloud-foundry.model.modelUtils
     * @description Apply a set of default parameters to be used in HCF list calls
     * @param {object} params - existing custom parameters, these will override defaults
     * @returns {object} the $http service http parameters
     */
    function makeListParams(params) {
      return _.defaults(params, {
        'results-per-page': 100
      });
    }

    /**
     * @function dePaginate
     * @memberof cloud-foundry.model.modelUtils
     * @description Given a HCF response from a 'list' style call return a collection containing all results, not just
     * for the page in the response (the page in the response should be the first)
     * @param {Array} responseData - Response from a HCF 'list' request. This will contain pagination data
     * @param {object} httpConfigOptions - Any special http configuration options
     * @returns {promise} promise when complete containing the entire array
     * @public
     */
    function dePaginate(responseData, httpConfigOptions) {
      return _dePaginate([].concat(responseData.resources), responseData.next_url, httpConfigOptions);
    }

    function _dePaginate(list, nextUrl, httpConfigOptions) {
      if (!nextUrl) {
        return $q.when(list);
      }

      return $http.get('/pp/v1/proxy' + nextUrl, httpConfigOptions).then(function (response) {
        return _dePaginate(list.concat(response.data.resources), response.data.next_url, httpConfigOptions);
      });
    }

  }
})();
