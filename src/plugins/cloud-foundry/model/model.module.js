(function () {
  'use strict';

  angular
    .module('cloud-foundry.model', [], config);

  config.$inject = [
    '$httpProvider'
  ];

  function config($httpProvider) {
    $httpProvider.interceptors.push(interceptor);
  }

  interceptor.$inject = [
    '$stateParams'
  ];

  /**
   * @name interceptor
   * @description A $http interceptor that adds `x-cnap-cnsi-list`
   * header to each request if the CNSI guid is present in the
   * URL (route).
   * @params {object} $stateParams - the UI router $stateParams service
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
      if (angular.isUndefined(config.headers['x-cnap-cnsi-list']) && angular.isDefined(cnsiGuid)) {
        config.headers['x-cnap-cnsi-list'] = cnsiGuid;
      }
      return config;
    }
  }

})();
