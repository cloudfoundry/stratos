(function () {
  'use strict';

  describe('user model', function () {
    var $httpBackend, user, mockData;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      user = modelManager.retrieve('app.model.user');

      mockData = { id: 1, username: 'dev', registered: true };
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(user).toBeDefined();
    });

    it('should have initial properties defined', function () {
      expect(user.apiManager).toBeDefined();
      expect(user.data).toEqual({});
    });

    it('should set `data` on getLoggedInUser()', function () {
      $httpBackend.when('GET', '/api/users/loggedIn')
        .respond(200, mockData);

      var expectedData = { id: 1, username: 'dev', registered: true };
      user.getLoggedInUser().then(function () {
        expect(user.data).toEqual(expectedData);
      });

      $httpBackend.flush();
    });

    it('should not set `data` on getLoggedInUser() and error', function () {
      $httpBackend.when('GET', '/api/users/loggedIn').respond(403, {});

      user.getLoggedInUser().then(function () {}, function (error) {
        expect(error.status).toBe(403);
        expect(error.data).toEqual({});
        expect(user.data).toEqual({});
      });

      $httpBackend.flush();
    });

    it('should POST correct data on create()', function () {
      $httpBackend.expectPOST('/api/users', { registered: true })
        .respond(200, mockData);

      user.create({ registered: true })
        .then(function (response) {
          expect(response).toEqual({ id: 1, username: 'dev', registered: true });
        });

      $httpBackend.flush();
    });

    it('should DELETE correct user on remove()', function () {
      $httpBackend.expectDELETE('/api/users/1').respond(200, '');
      user.remove(1);
      $httpBackend.flush();
    });

    it('should PUT correct data on update()', function () {
      $httpBackend.expectPUT('/api/users/1', { registered: false })
        .respond(200, { registered: false });

      user.update(1, { registered: false })
        .then(function () {
          expect(user.data.registered).toBe(false);
        });

      $httpBackend.flush();
    });

    it('should PUT correct data on updateRegistered()', function () {
      user.data.id = 1;

      $httpBackend.expectPUT('/api/users/1', { registered: false })
        .respond(200, { registered: false });

      user.updateRegistered(false)
        .then(function () {
          expect(user.data.registered).toBe(false);
        });

      $httpBackend.flush();
    });
  });

})();
