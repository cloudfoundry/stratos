(function () {
  'use strict';

  describe('bounce-spinner directive', function () {
    var element, bounceSpinnerCtrl;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    describe('with defaults', function () {
      beforeEach(inject(function ($injector) {
        var $compile = $injector.get('$compile');
        var $scope = $injector.get('$rootScope').$new();

        var markup = '<bounce-spinner></bounce-spinner>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        bounceSpinnerCtrl = element.controller('bounceSpinner');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should contain a div element with three bounce divs', function () {
        var spinnerDiv = element.find('div');
        expect(spinnerDiv).toBeDefined();
        expect(spinnerDiv.children().length).toBe(3);
      });

      it('should set classes to empty', function () {
        expect(bounceSpinnerCtrl.classes).toBe('');
      });
    });

    describe('with `classes` option', function () {
      beforeEach(inject(function ($injector) {
        var $compile = $injector.get('$compile');
        var $scope = $injector.get('$rootScope').$new();

        var markup = '<bounce-spinner classes="foo bar"></bounce-spinner>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        bounceSpinnerCtrl = element.controller('bounceSpinner');
      }));

      it('should set optional classes when passed in', function () {
        expect(bounceSpinnerCtrl.classes).toBe('foo bar');
      });
    });
  });

})();
