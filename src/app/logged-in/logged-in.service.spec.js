(function () {
  'use strict';

  describe('logged-in service', function () {
    var appLoggedInLoggedInService, appEventEventService, $q, $document, $interval, $httpBackend, modelManager;
    var mocks = {};

    angular.module('IntervalMockModule', []).factory('$interval', function () {
      $interval = jasmine.createSpy().and.callFake(function (callback) {
        callback();
        return 'interval_created';
      });
      $interval.cancel = jasmine.createSpy();
      mocks.$interval = $interval;
      return $interval;
    });

    beforeEach(module('templates'));
    beforeEach(module('green-box-console', 'IntervalMockModule'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $interval = $injector.get('$interval');
      appLoggedInLoggedInService = $injector.get('appLoggedInLoggedInService');
      appEventEventService = $injector.get('appEventEventService');
      $document = $injector.get('$document');
      $q = $injector.get('$q');
      modelManager = $injector.get('modelManager');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(appLoggedInLoggedInService).toBeDefined();
      expect(appLoggedInLoggedInService.isLoggedIn).toBeDefined();
    });

    it('should not be logged in', function () {
      expect(appLoggedInLoggedInService.isLoggedIn()).toBe(false);
    });

    it('should update last interaction time', function () {
      appLoggedInLoggedInService.userInteracted();
    });

    it('should be logged in', function () {
      $httpBackend.when('GET', '/pp/v1/auth/session/verify').respond(200, {});
      $httpBackend.expectGET('/pp/v1/auth/session/verify');
      appEventEventService.$emit(appEventEventService.events.LOGIN);
      appEventEventService.$apply();
      expect(appLoggedInLoggedInService.isLoggedIn()).toBe(true);
      expect(mocks.$interval).toHaveBeenCalled();
      $httpBackend.flush();
    });

    it('should be logged out', function () {
      $httpBackend.when('GET', '/pp/v1/auth/session/verify').respond(200, {});
      $httpBackend.expectGET('/pp/v1/auth/session/verify');
      appEventEventService.$emit(appEventEventService.events.LOGIN);
      appEventEventService.$apply();
      expect(appLoggedInLoggedInService.isLoggedIn()).toBe(true);
      appEventEventService.$emit(appEventEventService.events.LOGOUT);
      appEventEventService.$apply();
      expect(appLoggedInLoggedInService.isLoggedIn()).toBe(false);
      $httpBackend.flush();
    });

    it('should update user interacted timestamp', function () {
      $document.find('html').triggerHandler('keydown');
    });

    describe('session expiry', function () {

      var accountModel;

      beforeEach(function () {
        jasmine.clock().install();
        accountModel = modelManager.retrieve('app.model.account');
        var mockModel = {
          logout: function () {
            return {
              finally: function () {}
            };
          },
          getAccountData: function () {
            return {
              sessionExpiresOn: moment('2015-10-19')
            };
          },
          verifySession: function () {
            return $q.reject();
          }
        };
        modelManager.register('app.model.account', mockModel);
      });

      afterEach(function () {
        jasmine.clock().uninstall();
        modelManager.register('app.model.account', accountModel);
      });

      it('should cause session expiry', function () {
        // Fake the last user interaction time
        var fakeUserInteractionTime = moment('2015-10-19').toDate();
        jasmine.clock().mockDate(fakeUserInteractionTime);
        appLoggedInLoggedInService.userInteracted();
        jasmine.clock().mockDate(moment('2016-10-19').toDate());
        appEventEventService.$emit(appEventEventService.events.LOGIN);
        appEventEventService.$apply();
        // We should be logged out
      });

      it('should logout if verifySession fails', function () {
        // Fake the last user interaction time
        var fakeUserInteractionTime = moment().toDate();
        jasmine.clock().mockDate(fakeUserInteractionTime);
        appLoggedInLoggedInService.userInteracted();
        jasmine.clock().mockDate(moment('2016-10-19').toDate());
        appEventEventService.$emit(appEventEventService.events.LOGIN);
        appEventEventService.$apply();
        // We should be logged out
      });

    });
  });
})();
