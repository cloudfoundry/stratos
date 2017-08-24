(function () {
  'use strict';

  describe('application directive', function () {
    var $httpBackend, $element, applicationCtrl, $state, redirectStateName;

    var testAptEndpoint = {
      Scheme: 'https',
      Host: 'api.test.com',
      Path: ''
    };

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();

      var markup = '<application></application>';

      $state = $injector.get('$state');
      $httpBackend = $injector.get('$httpBackend');
      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();
      applicationCtrl = $element.controller('application');
      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/proxy/v2/apps?page=1&results-per-page=48').respond(200, {guid: {}});

      // For some tests, the redirected state depends on whether the endpoints dashboard is available
      redirectStateName = $state.get('endpoint.dashboard') ? 'endpoint.dashboard' : 'error-page';
    }));

    afterEach(function () {
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

      // method invocation

      it('invoke `login` method - success - dev user - no cf services', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, {account: 'dev', scope: 'foo'});
        $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, []);
        $httpBackend.when('GET', '/pp/v1/info').respond(200, {});
        $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);

        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        // No endpoints are set up, so we should go to error page
        $httpBackend.expectGET('/pp/v1/cnsis/registered');

        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(true);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `login` method - success - admin user - no cf services', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, { account: 'admin', scope: 'ucp.admin' });
        $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, []);
        $httpBackend.when('GET', '/pp/v1/info').respond(200, {});
        $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);

        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        $httpBackend.expectGET('/pp/v1/cnsis');

        // No endpoints are set up - but admin user - so will not go to error page
        applicationCtrl.login('admin', 'admin');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(true);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `login` method - success - dev user - with services', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(200, { account: 'dev', scope: 'foo' });
        $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, [
          { guid: 'service', cnsi_type: 'cf', name: 'test', api_endpoint: testAptEndpoint }
        ]);
        $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);
        $httpBackend.when('GET', '/pp/v1/info').respond(200, {});

        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        $httpBackend.expectGET('/pp/v1/cnsis');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(true);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `login` method - failure with bad credentials', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(400, {});
        $httpBackend.when('GET', '/api/users/loggedIn').respond(500, {});
        $httpBackend.when('POST', '/api/users').respond(200, {id: 1});
        $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);
        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        applicationCtrl.login('dev', 'baddev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(true);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `login` method - failure with server error', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(500, {});
        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(true);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `login` method - failure because server failed to respond', function () {
        applicationCtrl.loggedIn = false;
        $httpBackend.when('POST', '/pp/v1/auth/login/uaa').respond(-1);
        $httpBackend.expectPOST('/pp/v1/auth/login/uaa');
        applicationCtrl.login('dev', 'dev');
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(false);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(true);
      });

      it('invoke `logout` method - success', function () {
        spyOn(applicationCtrl, 'reload').and.returnValue(false);
        applicationCtrl.loggedIn = true;
        $httpBackend.when('POST', '/pp/v1/auth/logout').respond(200, {});
        $httpBackend.expectPOST('/pp/v1/auth/logout');
        applicationCtrl.logout();
        $httpBackend.flush();

        //$rootScope.$digest();

        // App should reload
        expect(applicationCtrl.reload).toHaveBeenCalled();

        // Re-work if we re-instate logout in-app with model clean-up
        //expect(applicationCtrl.loggedIn).toBe(false);
        //expect(applicationCtrl.failedLogin).toBe(false);
        //expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        //expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      it('invoke `logout` method - failure', function () {
        applicationCtrl.loggedIn = true;
        $httpBackend.when('POST', '/pp/v1/auth/logout').respond(400, {});
        $httpBackend.expectPOST('/pp/v1/auth/logout');
        applicationCtrl.logout();
        $httpBackend.flush();
        expect(applicationCtrl.loggedIn).toBe(true);
        expect(applicationCtrl.failedLogin).toBe(false);
        expect(applicationCtrl.serverErrorOnLogin).toBe(false);
        expect(applicationCtrl.serverFailedToRespond).toBe(false);
      });

      describe('onLoggedIn as admin', function () {
        beforeEach(function () {
          $httpBackend.when('POST', '/pp/v1/auth/login/uaa')
            .respond(200, {account: 'admin', admin: true});
        });

        it('should go to endpoints dashboard if cluster count === 0', function () {
          $httpBackend.when('GET', '/pp/v1/cnsis')
            .respond(200, []);
          $httpBackend.when('GET', '/pp/v1/info').respond(200, []);
          $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);

          applicationCtrl.login('admin', 'admin');
          $httpBackend.flush();
          //$rootScope.$digest();

          expect(applicationCtrl.redirectState).toBe('endpoint.dashboard');
          expect(applicationCtrl.showGlobalSpinner).toBe(false);
          expect($state.current.name).toBe(redirectStateName);
        });

        it('should go to endpoints dashboard if cluster count > 0 and none connected', function () {
          var responseData = [
            {id: 1, name: 'name', api_endpoint: {Scheme: 'http', Host: 'api.host.com'}, cnsi_type: 'cf'}
          ];
          $httpBackend.when('GET', '/pp/v1/cnsis')
            .respond(200, responseData);
          $httpBackend.when('GET', '/pp/v1/info').respond(200, []);
          $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);

          applicationCtrl.login('admin', 'admin');
          $httpBackend.flush();

          expect(applicationCtrl.redirectState).toBe('endpoint.dashboard');
          expect(applicationCtrl.showGlobalSpinner).toBe(false);
        });

        it('should not go to endpoints dashboard if cluster count > 0 and at least one connected', function () {
          var responseData = [
            {id: 1, name: 'name', api_endpoint: {Scheme: 'http', Host: 'api.host.com'}, cnsi_type: 'cf'}
          ];
          $httpBackend.when('GET', '/pp/v1/cnsis')
            .respond(200, responseData);

          var future = 50000 + (new Date()).getTime() / 1000;

          $httpBackend.when('GET', '/pp/v1/info').respond(200, []);
          $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, [
            { account: 'test', token_expiry: future, guid: 'service', cnsi_type: 'cf', name: 'test', api_endpoint: testAptEndpoint }
          ]);

          applicationCtrl.login('admin', 'admin');
          $httpBackend.flush();

          expect(applicationCtrl.redirectState).toBe(false);
          expect(applicationCtrl.showGlobalSpinner).toBe(false);
        });
      });

      describe('onLoggedIn as dev', function () {
        beforeEach(function () {
          $httpBackend.when('POST', '/pp/v1/auth/login/uaa')
            .respond(200, {account: 'dev', scope: 'hdp3.dev'});
          $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, [
            { guid: 'service', cnsi_type: 'cf', name: 'test', api_endpoint: testAptEndpoint }
          ]);
        });

        it('should show service instance registration if we don\'t have registered services', function () {
          $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, []);
          $httpBackend.when('GET', '/pp/v1/info').respond(200, []);
          $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);

          applicationCtrl.login('dev', 'dev');
          $httpBackend.flush();

          expect(applicationCtrl.redirectState).toBe('endpoint.dashboard');
          expect(applicationCtrl.showGlobalSpinner).toBe(false);
        });

        it('should show service instance registration if we don\'t have connected services', function () {
          var responseData = [
            {id: 1, name: 'name', api_endpoint: {Scheme: 'http', Host: 'api.host.com'}, cnsi_type: 'cf'}
          ];
          $httpBackend.when('GET', '/pp/v1/cnsis')
            .respond(200, responseData);
          $httpBackend.when('GET', '/pp/v1/info').respond(200, []);
          $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);

          applicationCtrl.login('dev', 'dev');
          $httpBackend.flush();

          expect(applicationCtrl.redirectState).toBe('endpoint.dashboard');
          expect(applicationCtrl.showGlobalSpinner).toBe(false);
        });

        it('should not show service instance registration if we have connected services', function () {
          var future = 50000 + (new Date()).getTime() / 1000;

          $httpBackend.when('GET', '/pp/v1/info').respond(200, []);
          $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, [
            { account: 'test', token_expiry: future, guid: 'service', cnsi_type: 'cf', name: 'test', api_endpoint: testAptEndpoint }
          ]);

          applicationCtrl.login('dev', 'dev');
          $httpBackend.flush();

          expect(applicationCtrl.redirectState).toBe(false);
          expect(applicationCtrl.showGlobalSpinner).toBe(false);
        });
      });
    });
  });
})();
