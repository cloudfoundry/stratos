(function () {
  'use strict';

  angular
    .module('cloud-foundry.model', [], config);

  function config($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
  }

  /**
   * @name interceptor
   * @description A $http interceptor that adds `x-cap-cnsi-list`
   * header to each request if the CNSI guid is present in the
   * URL (route).
   * @param {object} $stateParams - the UI router $stateParams service
   * @returns {object} The request function
   */
  function interceptor($stateParams) {
    return {
      request: request
    };

    function request(config) {
      if (_.isString(config.url) && !_.startsWith(config.url, '/pp')) {
        return config;
      }

      var cnsiGuid = $stateParams.cnsiGuid;
      if (angular.isUndefined(config.headers['x-cap-cnsi-list']) && angular.isDefined(cnsiGuid)) {
        config.headers['x-cap-cnsi-list'] = cnsiGuid;
      }
      return config;
    }
  }

})();
