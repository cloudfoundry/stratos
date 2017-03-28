(function () {
  'use strict';

  describe('account model', function () {
    var $httpBackend, accountModel;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('modelManager');
      accountModel = modelManager.retrieve('app.model.account');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(accountModel).toBeDefined();
    });

    it('should have initial properties defined', function () {
      expect(accountModel.apiManager).toBeDefined();
      expect(accountModel.loggedIn).toBeDefined();
      expect(accountModel.loggedIn).toBe(false);
      expect(accountModel.accountData).toBeDefined();
      expect(Object.keys(accountModel.accountData).length).toBe(0);
    });

    it('should POST on logout', function () {
      accountModel.loggedIn = true;
      $httpBackend.when('POST', '/pp/v1/auth/logout').respond(200, {});
      $httpBackend.expectPOST('/pp/v1/auth/logout');
      accountModel.logout();
      $httpBackend.flush();
      expect(accountModel.loggedIn).toBe(false);
    });

    it('should handle login', function () {
      $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, {});
      $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
      accountModel.login('test_user_1', 'test_pw_1');
      $httpBackend.flush();
      expect(accountModel.loggedIn).toBe(true);
    });

    it('should handle login with empty response', function () {
      $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, '');
      $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
      accountModel.login('test_user_1', 'test_pw_1');
      $httpBackend.flush();
      expect(accountModel.loggedIn).toBe(false);
    });

    it('should not be an admin', function () {
      $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, {});
      $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
      accountModel.login('test_user_1', 'test_pw_1');
      $httpBackend.flush();
      expect(accountModel.loggedIn).toBe(true);
      expect(!!accountModel.isAdmin()).toBe(false);
    });

    it('should be an admin', function () {
      $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, {admin: true});
      $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
      accountModel.login('test_user_1', 'test_pw_1');
      $httpBackend.flush();
      expect(accountModel.loggedIn).toBe(true);
      expect(!!accountModel.isAdmin()).toBe(true);
    });

    it('should fail session verification when no valid session', function () {
      $httpBackend.when('GET', '/pp/v1/auth/session/verify').respond(401, {});
      $httpBackend.expectGET('/pp/v1/auth/session/verify');
      accountModel.verifySession().then(function () {
        fail();
      }).finally(function () {
        expect(accountModel.loggedIn).toBe(false);
      });
      $httpBackend.flush();
    });

    it('should pass session verification', function () {
      $httpBackend.when('GET', '/pp/v1/auth/session/verify').respond(200, {admin: true});
      $httpBackend.expectGET('/pp/v1/auth/session/verify');
      accountModel.verifySession().catch(function () {
        fail();
      }).then(function () {
        expect(accountModel.loggedIn).toBe(true);
        expect(!!accountModel.isAdmin()).toBe(true);
      });
      $httpBackend.flush();
    });
  });

})();
