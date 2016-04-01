(function () {
  'use strict';

  describe('user API', function () {
    var $httpBackend, userApi;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var apiManager = $injector.get('app.api.apiManager');
      userApi = apiManager.retrieve('app.api.user');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(userApi).toBeDefined();
    });

    it('should have `$http` property defined', function () {
      expect(userApi.$http).toBeDefined();
    });

    it('should send POST request for create()', function () {
      var mockUser = { id: 1, username: 'dev', registered: true };
      $httpBackend.when('POST', '/api/users').respond(200, mockUser);
      $httpBackend.expectPOST('/api/users', { registered: true });

      userApi.create({ registered: true })
        .then(function (response) {
          expect(response.data).toEqual({ id: 1, username: 'dev', registered: true });
        });

      $httpBackend.flush();
    });

    it('should send GET request for getLoggedInUser()', function () {
      var mockUser = { id: 1, username: 'dev', registered: true };
      $httpBackend.when('GET', '/api/users/loggedIn').respond(200, mockUser);

      userApi.getLoggedInUser()
        .then(function (response) {
          expect(response.data).toEqual({ id: 1, username: 'dev', registered: true });
        });

      $httpBackend.flush();
    });

    it('should send DELETE request for remove()', function () {
      $httpBackend.expectDELETE('/api/users/1').respond(200, '');
      userApi.remove(1);
      $httpBackend.flush();
    });

    it('should send PUT request for update()', function () {
      $httpBackend.expectPUT('/api/users/1', { registered: true })
        .respond(200, { registered: true });
      userApi.update(1, { registered: true });
      $httpBackend.flush();
    });
  });

})();
