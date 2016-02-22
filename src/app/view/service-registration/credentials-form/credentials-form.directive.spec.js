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
      var $element, $controller;

      beforeEach(function () {
        var markup = '<credentials-form service="service"><credentials-form/>';

        $element = angular.element(markup);
        $compile($element)($scope);

        $scope.$apply();

        $controller = $element.controller('credentialsForm');
        spyOn($controller, 'reset').and.callThrough();
      });

      it('should be defined', function () {
        expect($element).toBeDefined();
      });

      it('should have `account` property defined', function () {
        expect($controller.account).toBeDefined();
      });

      it('should have `eventService` property defined', function () {
        expect($controller.eventService).toBeDefined();
      });

      it('should have `_data` property initially set', function () {
        expect($controller._data).toEqual({ name: 'cluster1', url: 'cluster1_url' });
      });

      it('should update `_data` property when service changed', function () {
        $scope.service = { name: 'cluster2', url: 'cluster2_url' };
        $scope.$apply();

        expect($controller._data).toEqual({ name: 'cluster2', url: 'cluster2_url' });
      });

      it('should call reset() on cancel', function () {
        $controller.cancel();
        expect($controller.reset).toHaveBeenCalled();
      });

      it('should call reset() on register', function () {
        $controller._data.username = 'cluster1_username';
        $controller._data.password = 'cluster1_password';

        $controller.register();

        expect($controller.service.name).toBe('cluster1');
        expect($controller.service.url).toBe('cluster1_url');
        expect($controller.service.username).toBe('cluster1_username');
        expect($controller.service.password).toBe('cluster1_password');
        expect($controller.reset).toHaveBeenCalled();

        expect($scope.service.username).toBe('cluster1_username');
        expect($scope.service.password).toBe('cluster1_password');
      });

      it('should set error flags to false and set form as pristine on reset', function () {
        $controller.reset();

        expect($controller._data.username).toBe('');
        expect($controller._data.password).toBe('');
        expect($controller.failedRegister).toBe(false);
        expect($controller.serverErrorOnRegister).toBe(false);
        expect($controller.serverFailedToRespond).toBe(false);
        expect($controller.authenticating).toBe(false);
        expect($controller.credentialsForm.$pristine).toBeTruthy();
      });
    });

    describe('with onCancel', function () {
      var $element, $controller;

      beforeEach(function () {
        $scope.cancel = angular.noop;

        var markup = '<credentials-form service="service" on-cancel="cancel()">' +
                     '<credentials-form/>';

        $element = angular.element(markup);
        $compile($element)($scope);

        $scope.$apply();

        $controller = $element.controller('credentialsForm');
        spyOn($controller, 'onCancel').and.callThrough();
        spyOn($scope, 'cancel');
      });

      it('should be defined', function () {
        expect($element).toBeDefined();
      });

      it('should have `onCancel` property defined', function () {
        expect($controller.onCancel).toBeDefined();
      });

      it('should call onCancel() on cancel', function () {
        $controller.cancel();
        expect($controller.onCancel).toHaveBeenCalled();
        expect($scope.cancel).toHaveBeenCalled();
      });
    });

    describe('with onSubmit', function () {
      var $element, $controller;

      beforeEach(function () {
        $scope.register = angular.noop;

        var markup = '<credentials-form service="service" on-submit="register()">' +
                     '<credentials-form/>';

        $element = angular.element(markup);
        $compile($element)($scope);

        $scope.$apply();

        $controller = $element.controller('credentialsForm');
        spyOn($controller, 'onSubmit').and.callThrough();
        spyOn($scope, 'register');
      });

      it('should be defined', function () {
        expect($element).toBeDefined();
      });

      it('should have `onSubmit` property defined', function () {
        expect($controller.onSubmit).toBeDefined();
      });

      it('should call onSubmit() on register', function () {
        $controller.register();
        expect($controller.onSubmit).toHaveBeenCalled();
        expect($scope.register).toHaveBeenCalled();
      });
    });
  });

})();
