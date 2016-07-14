(function () {
  'use strict';

  describe('upgrade service', function () {
    var $httpBackend, applicationCtrl, $state, upgradeCheck, $http, $stateParams;

    var testAptEndpoint = {
      Scheme: 'https',
      Host: 'api.test.com',
      Path: ''
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      var markup = '<application></application>';
      $state = $injector.get('$state');
      $stateParams = $injector.get('$stateParams');
      $http = $injector.get('$http');
      $httpBackend = $injector.get('$httpBackend');
      var $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();
      applicationCtrl = $element.controller('application');
      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/proxy/v2/apps').respond(200, {guid: {}});
      upgradeCheck = $injector.get('app.view.upgradeCheck');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(upgradeCheck).toBeDefined();
    });

    describe('upgrade checking', function () {
      function generateResponse(status, url, hasRetryAfterHeade) {
        return {
          status: status,
          config: {
            url: url
          },
          headers: function () {
            return hasRetryAfterHeade ? '300' : undefined;
          }
        };
      }

      it('no match', function () {
        var response = generateResponse(400, '/github/url', false);
        expect(upgradeCheck.isUpgrading(response)).toBe(false);
      });

      it('match status code', function () {
        var response = generateResponse(503, '/github/url', false);
        expect(upgradeCheck.isUpgrading(response)).toBe(false);
      });

      it('match status code and header', function () {
        var response = generateResponse(503, '/github/url', true);
        expect(upgradeCheck.isUpgrading(response)).toBe(false);
      });

      it('match status code and url', function () {
        var response = generateResponse(503, '/pp/v1/url', false);
        expect(upgradeCheck.isUpgrading(response)).toBe(false);
      });

      it('match all', function () {
        var response = generateResponse(503, '/pp/v1/url', true);
        expect(upgradeCheck.isUpgrading(response)).toBe(true);
      });
    });

    describe('login', function () {

      it('invoke `login` method - failure with server error', function () {
        applicationCtrl.loggedIn = false;
        applicationCtrl.onLoggedOut();
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(500, {});
        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(true);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
        expect($state.current.name).toBe('');
      });

      it('503 not upgrade', function () {
        applicationCtrl.loggedIn = false;
        // Try to login when we are not upgrading butget a 503 response
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(503, {});
        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(true);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
        expect($state.current.name).toBe('');
      });

      it('503 is upgrade', function () {
        // Try to login when we are upgrading
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(503, {}, {'Retry-After': 300});
        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        $httpBackend.when('GET', '/app/view/console-error/console-error.html').respond(200, []);
        $httpBackend.expectGET('/app/view/console-error/console-error.html');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(true);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
        expect($state.current.name).toBe('error-page');
        expect($stateParams.error).toBe('upgrading');
      });
    });

    describe('api request in app', function () {

      beforeEach(function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, { account: 'dev', scope: 'foo' });
        $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, [
          { guid: 'service', cnsi_type: 'hcf', name: 'test', api_endpoint: testAptEndpoint }
        ]);
        $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);
        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        $httpBackend.expectGET('/pp/v1/cnsis');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(true);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
        expect($state.current.name).toBe('cf.applications.list.gallery-view');
      });

      it('503 is not an upgrade', function () {
        $httpBackend.when('GET', '/pp/v1/cnsis/test').respond(503, {}, {});
        $httpBackend.expectGET('/pp/v1/cnsis/test');
        $http.get('/pp/v1/cnsis/test');
        $httpBackend.flush();
        expect($state.current.name).toBe('cf.applications.list.gallery-view');
      });

      it('503 is not an protal proxy request', function () {
        $httpBackend.when('GET', '/github/v1/cnsis/test').respond(503, {}, {});
        $httpBackend.expectGET('/github/v1/cnsis/test');
        $http.get('/github/v1/cnsis/test');
        $httpBackend.flush();
        expect($state.current.name).toBe('cf.applications.list.gallery-view');
      });

      it('503 is upgrade', function () {
        $httpBackend.when('GET', '/pp/v1/cnsis/test').respond(503, {}, {'Retry-After': 300});
        $httpBackend.expectGET('/pp/v1/cnsis/test');
        $httpBackend.when('GET', '/app/view/console-error/console-error.html').respond(200, []);
        $httpBackend.expectGET('/app/view/console-error/console-error.html');
        $http.get('/pp/v1/cnsis/test');
        $httpBackend.flush();
        expect($state.current.name).toBe('error-page');
        expect($stateParams.error).toBe('upgrading');
      });
    });

  });
})();
