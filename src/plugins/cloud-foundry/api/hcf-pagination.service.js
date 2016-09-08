(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .factory('cloud-foundry.api.hcfPagination', hcfPagination);

  hcfPagination.$inject = [
    '$http',
    '$q'
  ];

  /**
   * @memberof cloud-foundry.api
   * @name hcfPagination
   * @description Handle general pagination helpers for HCF pagination
   * @param {object} $http - the Angular $http service
   * @param {object} $q - the Angular $q service
   * @returns {cloud-foundry.api.hcfPagination} the hcfPagination service
   */
  function hcfPagination($http, $q) {

    /**
     * @function unbindServiceFromApp
     * @memberof cloud-foundry.view.applications.services.serviceInstanceService
     * @description Given a HCF response from a 'list' style call return a collection containing all results, not just
     * for the page in the response (the page in the response should be the first)
     * @param {Array} responseData - Response from a HCF 'list' request. This will contain pagination data
     * @param {object} httpConfigOptions - Any special http configuration options
     * @returns {promise} promise containing the entire array
     * @public
     */
    this.dePaginate = function (responseData, httpConfigOptions) {
      return dePaginate([].concat(responseData.resources), responseData.next_url, httpConfigOptions);
    };

    function dePaginate(list, nextUrl, httpConfigOptions) {
      if (!nextUrl) {
        return $q.when(list);
      }

      return $http.get('/pp/v1/proxy' + nextUrl, httpConfigOptions).then(function (response) {
        return dePaginate(list.concat(response.data.resources), response.data.next_url, httpConfigOptions);
      });
    }

    return this;

  }

})();
