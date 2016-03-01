(function () {
  'use strict'

  describe('serviceInstanceApi', function () {
    var $httpBackend, $scope, serviceInstanceApi;

    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();

      var apiManager = $injector.get('app.api.apiManager');
      serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    }));
  });

})();
