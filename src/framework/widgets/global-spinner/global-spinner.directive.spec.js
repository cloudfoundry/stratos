(function () {
  'use strict';

  describe('global-spinner directive', function () {
    var $scope, $element;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      $scope.spinnerActive = false;

      var markup = '<global-spinner spinner-active="spinnerActive">Content</global-spinner>';

      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    it('should initially be hidden', function () {
      expect($element.find('spinner').length).toBe(0);
      expect($element.find('ng-transclude').length).toBe(0);
    });

    it('should initially be hidden', function () {
      $scope.spinnerActive = true;
      $scope.$apply();

      expect($element.find('spinner').length).toBe(1);
      expect($element.find('ng-transclude').text().trim()).toBe('Content');
    });
  });

})();
