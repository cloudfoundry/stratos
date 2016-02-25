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
        expect(credentialsFormCtrl.reset).toHaveBeenCalled();
      });

      it('should call reset() on register', function () {
        credentialsFormCtrl._data.username = 'cluster1_username';
        credentialsFormCtrl._data.password = 'cluster1_password';

        credentialsFormCtrl.register();

        expect(credentialsFormCtrl.service.name).toBe('cluster1');
        expect(credentialsFormCtrl.service.url).toBe('cluster1_url');
        expect(credentialsFormCtrl.service.username).toBe('cluster1_username');
        expect(credentialsFormCtrl.service.password).toBe('cluster1_password');
        expect(credentialsFormCtrl.reset).toHaveBeenCalled();

        expect($scope.service.username).toBe('cluster1_username');
        expect($scope.service.password).toBe('cluster1_password');
      });

      it('should set error flags to false and set form as pristine on reset', function () {
        credentialsFormCtrl.reset();

        expect(credentialsFormCtrl._data.username).toBe('');
        expect(credentialsFormCtrl._data.password).toBe('');
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

        var markup = '<credentials-form service="service" on-submit="register()">' +
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
        credentialsFormCtrl.register();
        expect(credentialsFormCtrl.onSubmit).toHaveBeenCalled();
        expect($scope.register).toHaveBeenCalled();
      });
    });
  });

})();
