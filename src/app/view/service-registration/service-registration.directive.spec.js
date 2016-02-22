(function () {
  'use strict';

  describe('service registration controller', function () {
    var $scope, $element, $controller;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      $scope.showRegistration = false;

      var markup = '<service-registration show-registration="showRegistration"><service-registration/>';

      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();

      $controller = $element.controller('serviceRegistration');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    it('should have `account` property defined', function () {
      expect($controller.account).toBeDefined();
    });

    it('should have `eventService` property defined', function () {
      expect($controller.eventService).toBeDefined();
    });

    it('should have `showRegistration` property initially set to false', function () {
      expect($controller.showRegistration).toBe(false);
    });

    it('should show service-registration component when showRegistration === true', function () {
      $scope.showRegistration = true;
      $scope.$apply();

      expect($controller.showRegistration).toBe(true);
      expect($element.find('div').length).toBeGreaterThan(0);
    });

    it('should hide service-registration component when registration completed', function () {
      $scope.showRegistration = true;
      $scope.$apply();

      $controller.completeRegistration();
      $scope.$apply();

      expect($controller.showRegistration).toBe(false);
      expect($element.find('div').length).toBe(0);
    });
  });

})();
