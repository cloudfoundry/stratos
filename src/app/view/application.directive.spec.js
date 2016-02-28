(function () {
  'use strict';

  describe('application directive', function () {
    var $httpBackend, $element, applicationCtrl;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();

      var markup = '<application><application/>';

      $httpBackend = $injector.get('$httpBackend');
      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();
      applicationCtrl = $element.controller('application');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('An ApplicationController instance', function () {
      it('should be defined', function () {
        expect(applicationCtrl).toBeDefined();
      });

      // property definitions

      it('should have properties `eventService` defined', function () {
        expect(applicationCtrl.eventService).toBeDefined();
      });

      it('should have properties `modelManager` defined', function () {
        expect(applicationCtrl.modelManager).toBeDefined();
        expect(applicationCtrl.modelManager.retrieve('app.model.account')).toBeDefined();
      });

      it('should have properties `loggedIn` defined', function () {
        expect(applicationCtrl.loggedIn).toBeDefined();
      });

      it('should have properties `loggedIn` defined as false by default', function () {
        expect(applicationCtrl.loggedIn).toBe(false);
      });

      it('should have properties `failedLogin` defined', function () {
        expect(applicationCtrl.failedLogin).toBeDefined();
      });

      it('should have properties `failedLogin` defined as false by default', function () {
        expect(applicationCtrl.failedLogin).toBe(false);
      });

      it('should have properties `serverErrorOnLogin` defined', function () {
        expect(applicationCtrl.serverErrorOnLogin).toBeDefined();
      });

      it('should have properties `serverErrorOnLogin` defined as false by default', function () {
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
      });

      it('should have properties `serverFailedToRespond` defined', function () {
        expect(applicationCtrl.serverFailedToRespond).toBeDefined();
      });

      it('should have properties `serverFailedToRespond` defined as false by default', function () {
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      // method definitions

      it('should have method `login` defined', function () {
        expect(angular.isFunction(applicationCtrl.login)).toBe(true);
      });

      it('should have method `logout` defined', function () {
        expect(angular.isFunction(applicationCtrl.logout)).toBe(true);
      });

      it('should have method `onLoggedIn` defined', function () {
        expect(angular.isFunction(applicationCtrl.onLoggedIn)).toBe(true);
      });

      it('should have method `onLoginFailed` defined', function () {
        expect(angular.isFunction(applicationCtrl.onLoginFailed)).toBe(true);
      });

      it('should have method `onLoggedOut` defined', function () {
        expect(angular.isFunction(applicationCtrl.onLoggedOut)).toBe(true);
      });

      // method invocation

      it('invoke `login` method - success', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/api/auth/login/').respond(200, {});
        $httpBackend.when('GET', '/api/service-instances?username=dev').respond(200, { items: [] });
        $httpBackend.expectPOST('/api/auth/login/');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(true);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `login` method - failure with bad credentials', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/api/auth/login/').respond(400, {});
        $httpBackend.when('GET', '/api/service-instances?username=dev').respond(200, { items: [] });
        $httpBackend.expectPOST('/api/auth/login/');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(true);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `login` method - failure with server error', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/api/auth/login/').respond(500, {});
        $httpBackend.expectPOST('/api/auth/login/');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(true);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `login` method - failure because server failed to respond', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/api/auth/login/').respond(-1);
        $httpBackend.expectPOST('/api/auth/login/');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(true);
      });

      it('invoke `logout` method - success', function () {
        applicationCtrl.loggedIn = true;
        $httpBackend.when('GET', '/api/auth/logout').respond(200, {});
        $httpBackend.expectGET('/api/auth/logout');
        applicationCtrl.logout();
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `logout` method - failure', function () {
        applicationCtrl.loggedIn = true;
        $httpBackend.when('GET', '/api/auth/logout').respond(400, {});
        $httpBackend.expectGET('/api/auth/logout');
        applicationCtrl.logout();
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(true);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

    });

  });

})();
