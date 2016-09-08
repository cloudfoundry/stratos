(function () {
  'use strict';

  describe('error module', function () {
    var $http, $httpBackend, stackatoInfoService, errorService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $http = $injector.get('$http');
      stackatoInfoService = $injector.get('stackatoInfoService');
      errorService = $injector.get('app.error.errorService');
      spyOn(errorService, 'clearSystemError').and.callThrough();
      spyOn(errorService, 'setSystemError').and.callThrough();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should clear error on succcessful http call', function () {
      $httpBackend.when('GET', '/pp/v1/version').respond(200, {});
      $httpBackend.expectGET('/pp/v1/version');
      stackatoInfoService.version();
      $httpBackend.flush();
      expect(errorService.clearSystemError).toHaveBeenCalled();
      expect(errorService.setSystemError).not.toHaveBeenCalled();
    });

    it('should skip error on state code <> -1', function () {
      $httpBackend.when('GET', '/pp/v1/version').respond(500, {});
      $httpBackend.expectGET('/pp/v1/version');
      stackatoInfoService.version();
      $httpBackend.flush();
      expect(errorService.clearSystemError).not.toHaveBeenCalled();
      expect(errorService.setSystemError).not.toHaveBeenCalled();
    });

    it('should set error on failed http call', function () {
      $httpBackend.when('GET', '/pp/v1/version').respond(-1, {});
      $httpBackend.expectGET('/pp/v1/version');
      stackatoInfoService.version();
      $httpBackend.flush();
      expect(errorService.clearSystemError).not.toHaveBeenCalled();
      expect(errorService.setSystemError).toHaveBeenCalled();
    });

    it('should set and clear', function () {
      $httpBackend.when('GET', '/pp/v1/version').respond(-1, {});
      $httpBackend.expectGET('/pp/v1/version');
      stackatoInfoService.version();
      $httpBackend.flush();
      expect(errorService.clearSystemError).not.toHaveBeenCalled();
      expect(errorService.setSystemError).toHaveBeenCalled();
      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, {});
      $httpBackend.expectGET('/pp/v1/cnsis');
      $http.get('/pp/v1/cnsis');
      $httpBackend.flush();
      expect(errorService.clearSystemError).toHaveBeenCalled();
    });

  });

})();
