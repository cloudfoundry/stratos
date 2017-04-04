(function () {
  'use strict';

  describe('navigation directive', function () {
    var $element, navigationCtrl;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      var markup = '<navigation><navigation/>';

      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();
      navigationCtrl = $element.controller('navigation');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('A NavigationController instance', function () {
      it('should be defined', function () {
        expect(navigationCtrl).toBeDefined();
      });

      // property definitions

      it('should have properties `navigationModel` defined', function () {
        expect(navigationCtrl.navigationModel).toBeDefined();
      });

    });

  });

})();
