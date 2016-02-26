(function () {
  'use strict';

  describe('credentials-form directive', function () {
    var $compile, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      $scope.service = { name: 'cluster1', url: 'cluster1_url' };
    }));

    describe('with default functionality', function () {
      var element, credentialsFormCtrl;

      beforeEach(function () {
        var markup = '<credentials-form service="service"><credentials-form/>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        credentialsFormCtrl = element.controller('credentialsForm');
        spyOn(credentialsFormCtrl, 'reset').and.callThrough();
      });

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should have `account` property defined', function () {
        expect(credentialsFormCtrl.account).toBeDefined();
      });

      it('should have `eventService` property defined', function () {
        expect(credentialsFormCtrl.eventService).toBeDefined();
      });

      it('should have `_data` property initially set', function () {
        expect(credentialsFormCtrl._data).toEqual({ name: 'cluster1', url: 'cluster1_url' });
      });

      it('should update `_data` property when service changed', function () {
        $scope.service = { name: 'cluster2', url: 'cluster2_url' };
        $scope.$apply();

        expect(credentialsFormCtrl._data).toEqual({ name: 'cluster2', url: 'cluster2_url' });
      });

      it('should call reset() on cancel', function () {
        credentialsFormCtrl.cancel();

        expect(credentialsFormCtrl._data.username).toBeUndefined();
        expect(credentialsFormCtrl._data.password).toBeUndefined();
        expect(credentialsFormCtrl.reset).toHaveBeenCalled();
      });

      it('should call reset() on register', function () {
        credentialsFormCtrl._data.username = 'cluster1_username';
        credentialsFormCtrl._data.password = 'cluster1_password';

        credentialsFormCtrl.register();

        expect(credentialsFormCtrl.reset).toHaveBeenCalled();
        expect(credentialsFormCtrl._data.registered).toBe(true);
        expect(credentialsFormCtrl._data.password).toBeUndefined();
      });

      it('should set error flags to false and set form as pristine on reset', function () {
        credentialsFormCtrl.reset();

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

        var markup = '<credentials-form service="service" on-cancel="cancel()">' +
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

        var markup = '<credentials-form service="service" on-submit="register(data)">' +
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

      it('should call onSubmit() on register', function () {
        credentialsFormCtrl._data.username = 'cluster1_username';
        credentialsFormCtrl._data.password = 'cluster1_password';

        credentialsFormCtrl.register();

        var serviceData = {
          name: 'cluster1',
          url: 'cluster1_url',
          username: 'cluster1_username',
          registered: true
        };

        expect(credentialsFormCtrl.onSubmit).toHaveBeenCalledWith({ data: serviceData });
        expect($scope.register).toHaveBeenCalled();
      });
    });
  });

})();
