(function () {
  'use strict';

  describe('application directive', function () {
    var $element;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();

      var markup = '<application><application/>';
      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });
  });
})();
