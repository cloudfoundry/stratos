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
   * @description ??????????????????
   * @param {object} $http - the Angular $http service
   * @param {object} $q - the Angular $q service
   */
  function hcfPagination($http, $q) {

    var that = this;

    /**
     * @function unbindServiceFromApp
     * @memberof cloud-foundry.view.applications.services.serviceInstanceService
     * @description Unbind service instance from application
     * @param {Array} list - ??????
     * @param {object} responseData - ??????
     * @param {object} httpConfigOptions - ??????
     * @returns {promise} The confirm dialog promise object
     * @public
     */
    this.dePaginate = function (responseData, httpConfigOptions) {
      return dePaginate([].concat(responseData.resources), responseData.next_url, httpConfigOptions);
    };

    function dePaginate(list, nextUrl, httpConfigOptions) {
      if (!nextUrl) {
        return $q.when(list);
      }

      return $http.get('/pp/v1/proxy/' + nextUrl, httpConfigOptions).then(function (response) {
        return dePaginate(list.concat(response.data.resources), response.data.next_url, httpConfigOptions);
      });
    }

    return this;

  }

})();
