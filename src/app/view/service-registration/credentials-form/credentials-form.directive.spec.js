(function () {
  'use strict';

  describe('credentials-form directive', function () {
    var $compile, $httpBackend, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      $scope.cnsi = { name: 'cluster1', url: 'cluster1_url' };
    }));

    describe('with default functionality', function () {
      var element, credentialsFormCtrl;

      beforeEach(function () {
        var markup = '<credentials-form cnsi="cnsi"><credentials-form/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        credentialsFormCtrl = element.controller('credentialsForm');
        spyOn(credentialsFormCtrl, 'reset').and.callThrough();
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `eventService` property defined', function () {
        expect(credentialsFormCtrl.eventService).toBeDefined();
      });

      it('should have `_data` property initially empty', function () {
        expect(credentialsFormCtrl._data).toEqual({});
      });

      it('should call reset() on cancel', function () {
        credentialsFormCtrl.cancel();
        expect(credentialsFormCtrl.reset).toHaveBeenCalled();
      });

      it('should call reset() on connect', function () {
        var mockResponse = {
          id: 1,
          name: 'cluster1',
          url: 'cluster1_url',
          username: 'cluster1_username',
          account: 'cluster1_password',
          token_expiry: 3600
        };
        $httpBackend.when('POST', '/pp/v1/auth/login/cnsi').respond(200, mockResponse);

        credentialsFormCtrl.connect();
        $httpBackend.flush();

        expect(credentialsFormCtrl.reset).toHaveBeenCalled();
      });

      it('should set error flags to false and set form as pristine on reset', function () {
        credentialsFormCtrl.reset();

        expect(credentialsFormCtrl._data.username).toBeUndefined();
        expect(credentialsFormCtrl._data.password).toBeUndefined();
        expect(credentialsFormCtrl.failedRegister).toBe(false);
        expect(credentialsFormCtrl.serverErrorOnRegister).toBe(false);
        expect(credentialsFormCtrl.serverFailedToRespond).toBe(false);
        expect(credentialsFormCtrl.authenticating).toBe(false);
        expect(credentialsFormCtrl.credentialsForm.$pristine).toBeTruthy();
      });
    });

    describe('with onCancel', function () {
      var element, credentialsFormCtrl;

      beforeEach(function () {
        $scope.cancel = angular.noop;

        var markup = '<credentials-form cnsi="cnsi" on-cancel="cancel()">' +
                     '<credentials-form/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        credentialsFormCtrl = element.controller('credentialsForm');
        spyOn(credentialsFormCtrl, 'onCancel').and.callThrough();
        spyOn($scope, 'cancel');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `onCancel` property defined', function () {
        expect(credentialsFormCtrl.onCancel).toBeDefined();
      });

      it('should call onCancel() on cancel', function () {
        credentialsFormCtrl.cancel();
        expect(credentialsFormCtrl.onCancel).toHaveBeenCalled();
        expect($scope.cancel).toHaveBeenCalled();
      });
    });

    describe('with onSubmit', function () {
      var element, credentialsFormCtrl;

      beforeEach(function () {
        $scope.register = angular.noop;

        var markup = '<credentials-form cnsi="cnsi" on-submit="register()">' +
                     '<credentials-form/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        credentialsFormCtrl = element.controller('credentialsForm');
        spyOn(credentialsFormCtrl, 'onSubmit').and.callThrough();
        spyOn($scope, 'register');
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `onSubmit` property defined', function () {
        expect(credentialsFormCtrl.onSubmit).toBeDefined();
      });

      it('should call onSubmit() on connect', function () {
        var mockResponse = {
          id: 1,
          name: 'cluster1',
          url: 'cluster1_url',
          username: 'dev',
          account: 'dev',
          token_expiry: 3600
        };
        $httpBackend.when('POST', '/pp/v1/auth/login/cnsi').respond(200, mockResponse);

        credentialsFormCtrl.connect();
        $httpBackend.flush();

        expect(credentialsFormCtrl.onSubmit).toHaveBeenCalled();
        expect($scope.register).toHaveBeenCalled();
      });
    });
  });

})();
