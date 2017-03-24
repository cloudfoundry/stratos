(function () {
  'use strict';

  describe('percentGauge directive', function () {
    var $compile, injector;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      injector = $injector;
      $compile = injector.get('$compile');
    }));

    describe('that is not at max', function () {
      var $element, $scope;

      beforeEach(function () {
        $scope = injector.get('$rootScope').$new();
        var markup = '<percent-gauge title="This one is a third" value=".33"></percent-gauge>';
        $element = angular.element(markup);
        $compile($element)($scope);
        $scope.$apply();
      });

      it('should not have the percent-gauge-at-max class', function () {
        expect($element.find('.percent-gauge').hasClass('percent-gauge-at-max')).toBe(false);
      });

      it('should not have the percent-gauge-over-max class', function () {
        expect($element.find('.percent-gauge').hasClass('percent-gauge-over-max')).toBe(false);
      });

      it('should have a gauge-info div displaying "33%"', function () {
        expect($element.find('.gauge-info').text()).toBe('33%');
      });

      it('should have a title included', function () {
        expect($element.find('.gauge-label').text().trim()).toMatch(new RegExp('This one is a third$'));
      });

      it('should have a bar that is 33% wide', function () {
        expect($element.find('.percent-gauge-utilized-bar').attr('style')).toBe('width: 33%;');
      });

    });

    describe('that is at max with value-text included', function () {
      var $element, $scope;

      beforeEach(function () {
        $scope = injector.get('$rootScope').$new();
        var markup = '<percent-gauge title="Full Bar" value="1" value-text="ducks are bad"></percent-gauge>';
        $element = angular.element(markup);
        $compile($element)($scope);
        $scope.$apply();
      });

      it('should not have the percent-gauge-over-max class', function () {
        expect($element.find('.percent-gauge').hasClass('percent-gauge-over-max')).toBe(false);
      });

      it('should have a gauge-info div displaying "MAX"', function () {
        expect($element.find('.gauge-info').text()).toBe('ducks are bad');
      });

      it('should have a title included', function () {
        expect($element.find('.gauge-label').text().trim()).toMatch(new RegExp('Full Bar$'));
      });

      it('should have a bar that is 100% wide', function () {
        expect($element.find('.percent-gauge-utilized-bar').attr('style')).toBe('width: 100%;');
      });

    });

    describe('that is over max', function () {
      var $element, $scope;

      beforeEach(function () {
        $scope = injector.get('$rootScope').$new();
        var markup = '<percent-gauge title="Over-Filled Bar" value="1.1"></percent-gauge>';
        $element = angular.element(markup);
        $compile($element)($scope);
        $scope.$apply();
      });

      it('should have the percent-gauge-over-max class', function () {
        expect($element.find('.percent-gauge').hasClass('percent-gauge-over-max')).toBe(true);
      });

      it('should have a gauge-info div displaying "110%"', function () {
        expect($element.find('.gauge-info').text()).toBe('110%');
      });

      it('should have a title included', function () {
        expect($element.find('.gauge-label').text().trim()).toMatch(new RegExp('Over-Filled Bar$'));
      });

      it('should have a bar that is 100% wide', function () {
        expect($element.find('.percent-gauge-utilized-bar').attr('style')).toBe('width: 100%;');
      });

    });
  });

})();
