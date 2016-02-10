(function () {
  'use strict';

  describe('application directive', function () {
    var $element, $controller;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();

      var markup = '<application><application/>';
      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();
      $controller = $element.controller('application');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });
  });
})();
