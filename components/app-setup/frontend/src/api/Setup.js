(function () {
  'use strict';

  angular
    .module('app-setup.api')
    .run(registerApi);

  function registerApi($http, $httpParamSerializer, apiManager) {
    apiManager.register('app-setup.api.setup', new SetupApi($http, $httpParamSerializer));
  }

  function SetupApi($http, $httpParamSerializer) {

    return {
      setup: setup,
      updateSetup: updateSetup
    };

    function _postForm(url, formData) {
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      return $http.post(url, $httpParamSerializer(formData), config);
    }

    function setup(value) {
      return _postForm('/pp/v1/setup', value);
    }

    function updateSetup(value) {
      return _postForm('/pp/v1/setup/update', value);
    }

  }

})();
