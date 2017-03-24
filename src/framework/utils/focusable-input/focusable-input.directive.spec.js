(function () {
  'use strict';

  describe('focusable-input directive', function () {
    beforeEach(module('helion.framework.utils'));

    describe('with default class', function () {
      var $element;

      beforeEach(inject(function ($injector) {
        var $compile = $injector.get('$compile');
        var $scope = $injector.get('$rootScope').$new();

        var markup = '<div focusable-input><input type="text"/></div>';

        $element = angular.element(markup);
        $compile($element)($scope);

        $scope.$apply();
      }));

      it('should add class focus when input is focused', function () {
        $element.find('input').triggerHandler('focus');
        expect($element.hasClass('focus')).toBeTruthy();
      });

      it('should remove class focus when input is blurred', function () {
        $element.find('input').triggerHandler('blur');
        expect($element.hasClass('focus')).toBeFalsy();
      });
    });

    describe('with custom class', function () {
      var $element;

      beforeEach(inject(function ($injector) {
        var $compile = $injector.get('$compile');
        var $scope = $injector.get('$rootScope').$new();

        var markup = '<div focusable-input="myCustomClass"><input type="text"/></div>';

        $element = angular.element(markup);
        $compile($element)($scope);

        $scope.$apply();
      }));

      it('should add class myCustomClass when input is focused', function () {
        $element.find('input').triggerHandler('focus');
        expect($element.hasClass('myCustomClass')).toBeTruthy();
      });

      it('should remove class myCustomClass when input is blurred', function () {
        $element.find('input').triggerHandler('blur');
        expect($element.hasClass('myCustomClass')).toBeFalsy();
      });
    });
  });

})();
