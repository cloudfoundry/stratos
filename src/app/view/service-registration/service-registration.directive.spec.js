(function () {
  'use strict';

  describe('service-registration directive', function () {
    var $compile, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      $scope.showRegistration = false;
    }));

    describe('without overlay', function () {
      var $element, $controller;

      beforeEach(function () {
        var markup = '<service-registration><service-registration/>';

        $element = angular.element(markup);
        $compile($element)($scope);

        $scope.$apply();

        $controller = $element.controller('serviceRegistration');
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

      it('should have `overlay` property initially set to true', function () {
        expect($controller.overlay).toBe(false);
      });

      it('should have undefined `showOverlayRegistration` property', function () {
        expect($controller.showOverlayRegistration).toBeUndefined();
      });
    });

    describe('with overlay', function () {
      var $element, $controller;

      beforeEach(function () {
        var markup = '<service-registration show-overlay-registration="showRegistration">' +
                     '<service-registration/>';

        $element = angular.element(markup);
        $compile($element)($scope);

        $scope.$apply();

        $controller = $element.controller('serviceRegistration');
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

      it('should have `overlay` property initially set to true', function () {
        expect($controller.overlay).toBe(true);
      });

      it('should have `showOverlayRegistration` property initially set to false', function () {
        expect($controller.showOverlayRegistration).toBe(false);
      });

      it('should show service-registration component when showRegistration === true', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        expect($controller.showOverlayRegistration).toBe(true);
        expect($element.find('div').length).toBeGreaterThan(0);
      });

      it('should hide service-registration component when registration completed', function () {
        $scope.showRegistration = true;
        $scope.$apply();

        $controller.completeRegistration();
        $scope.$apply();

        expect($controller.showOverlayRegistration).toBe(false);
        expect($element.find('div').length).toBe(0);
      });
    });
  });

})();
