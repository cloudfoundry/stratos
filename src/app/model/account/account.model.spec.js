(function () {
  'use strict';

  describe('account model', function () {
    var $httpBackend, accountModel, sessionName, $cookies;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      accountModel = modelManager.retrieve('app.model.account');

      var apiManager = $injector.get('app.api.apiManager');
      sessionName = apiManager.retrieve('app.api.account').sessionName;
      $cookies = $injector.get('$cookies');
    }));

    afterEach(function () {
      $cookies.remove(sessionName);
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(accountModel).toBeDefined();
    });

    it('should have initial properties defined', function () {
      expect(accountModel.$cookies).toBeDefined();
      expect(accountModel.apiManager).toBeDefined();
      expect(accountModel.loggedIn).toBeDefined();
      expect(accountModel.loggedIn).toBe(false);
      expect(accountModel.data).toBeDefined();
      expect(Object.keys(accountModel.data).length).toBe(0);
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

    it('should have session cookie', function () {
      $cookies.put(sessionName, 'true');
      expect(!!accountModel.hasSessionCookie()).toBe(true);
    });

    it('should not have session cookie', function () {
      expect(!!accountModel.hasSessionCookie()).toBe(false);
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

    it('should fail session verification when there is no cookie', function () {
      accountModel.loggedIn = true;
      accountModel.data = 'test';
      accountModel.verifySession().then(function () {
        fail();
      }).finally(function () {
        expect(accountModel.loggedIn).toBe(false);
        expect(accountModel.data).not.toBeDefined();
      });
    });

    it('should pass session verification', function () {
      $httpBackend.when('GET', '/pp/v1/auth/session/verify').respond(200, {admin: true});
      $httpBackend.expectGET('/pp/v1/auth/session/verify');
      $cookies.put(sessionName, 'true');
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
