(function () {
  'use strict';

  describe('login-form directive', function () {
    var $element, $controller;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(module(function ($provide) {
      $provide.provider('app.basePath', function () {
        this.$get = function () {
          return 'app/';
        };
      });
    }));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();

      var markup = '<login-form><login-form/>';

      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();

      $controller = $element.controller('loginForm');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('LoginFormController', function () {
      it('should be defined', function () {
        expect($controller).toBeDefined();
      });

      it('should not show password in plain text by default', function () {
        expect($controller.showPassword).toBe(false);
      });

      it('should allow toggling of password in plain text', function () {
        $controller.showHidePassword();
        expect($controller.showPassword).toBe(true);

        $controller.showHidePassword();
        expect($controller.showPassword).toBe(false);
      });
    });
  });

})();
