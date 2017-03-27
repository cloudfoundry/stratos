(function () {
  'use strict';

  describe('spinner directive', function () {
    var $element;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();

      var markup = '<spinner></spinner>';

      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    it('should contain an svg element', function () {
      expect($element.find('svg')).toBeDefined();
    });

    it('should contain an svg element with two circle elements', function () {
      expect($element.find('circle').length).toBe(2);
    });
  });

})();
