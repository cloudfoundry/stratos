(function () {
  'use strict';

  describe('login-form directive', function () {
    var $timeout, $element, $controller;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(module(function ($provide) {
      $provide.provider('appBasePath', function () {
        this.$get = function () {
          return 'app/';
        };
      });
    }));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      $timeout = $injector.get('$timeout');

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

      it('should have properties `appEventEventService` defined', function () {
        expect($controller.appEventEventService).toBeDefined();
      });

      it('`clearPassword` should called when events.LOGIN_FAILED triggered', function () {
        spyOn($controller, 'clearPassword');
        $controller.appEventEventService.$emit($controller.appEventEventService.events.LOGIN_FAILED);
        expect($controller.clearPassword).toHaveBeenCalled();
      });

      it('`clearPassword` should called when events.HTTP_5XX_ON_LOGIN triggered', function () {
        spyOn($controller, 'clearPassword');
        $controller.appEventEventService.$emit($controller.appEventEventService.events.HTTP_5XX_ON_LOGIN);
        expect($controller.clearPassword).toHaveBeenCalled();
      });

      it('`clearPassword` should called when events[\'HTTP_-1\'] triggered', function () {
        spyOn($controller, 'clearPassword');
        $controller.appEventEventService.$emit($controller.appEventEventService.events['HTTP_-1']);
        expect($controller.clearPassword).toHaveBeenCalled();
      });

      it('should cancel loginTimeout and set loggingIn === false when clearPassword() is called', function () {
        spyOn($controller.$timeout, 'cancel').and.callThrough();

        $controller.clearPassword();
        expect($controller.$timeout.cancel).toHaveBeenCalled();
        expect($controller.loggingIn).toBe(false);
      });

      it('should set loggingIn === false in $timeout when login() called', function () {
        $controller.login();
        $timeout.flush();

        expect($controller.loggingIn).toBe(true);
      });
    });
  });

})();
