(function () {
  'use strict';

  describe('flyout directive', function () {
    var $scope, $element, flyoutCtrl;

    beforeEach(module('templates'));
    beforeEach(module('app.framework'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();

      $scope.flyoutActive = false;

      var markup = '<flyout flyout-active="flyoutActive">' +
        'Flyout Content' +
        '<flyout>';

      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();

      flyoutCtrl = $element.controller('flyout');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    it('should not contain content when inactive', function () {
      expect($element.find('ng-transclude').text().trim()).toBe('');
    });

    it('should initially be inactive', function () {
      expect($element.find('div').hasClass('active')).toBe(false);
    });

    it('should be active when flyoutActive === true', function () {
      flyoutCtrl.flyoutActive = true;
      $scope.$apply();

      expect($element.find('div').children().hasClass('active')).toBe(true);
    });

    it('should contain right content when active', function () {
      flyoutCtrl.flyoutActive = true;
      $scope.$apply();

      expect($element.find('ng-transclude').text().trim()).toBe('Flyout Content');
    });

    it('should be inactive after opening and calling close()', function () {
      flyoutCtrl.flyoutActive = true;
      $scope.$apply();

      expect($element.find('div').children().hasClass('active')).toBe(true);

      flyoutCtrl.close();
      $scope.$apply();

      expect(flyoutCtrl.flyoutActive).toBe(false);
      expect($element.find('div').children().hasClass('active')).toBe(false);
    });
  });

})();
