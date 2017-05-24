(function () {
  'use strict';

  describe('flyout directive', function () {
    var $scope, $element;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();

      $scope.flyoutActive = false;
      $scope.flyoutCloseIcon = null;

      var markup = '<flyout flyout-active="flyoutActive" ' +
        'flyout-close-icon="flyoutCloseIcon">' +
        'Flyout Content' +
        '<flyout>';

      $element = angular.element(markup);
      $compile($element)($scope);

      $scope.$apply();
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    it('should initially use glyphicon for close icon', function () {
      expect($element.isolateScope().flyoutCloseIcon).toBe('glyphicon glyphicon-remove');
    });

    it('should not contain content when inactive', function () {
      expect($element.find('ng-transclude').text().trim()).toBe('');
    });

    it('should initially be inactive', function () {
      expect($element.find('div').hasClass('active')).toBe(false);
    });

    it('should be active when flyoutActive === true', function () {
      $scope.flyoutActive = true;
      $scope.$apply();

      expect($element.find('div').children().hasClass('active')).toBe(true);
    });

    it('should contain right content when active', function () {
      $scope.flyoutActive = true;
      $scope.$apply();

      expect($element.find('ng-transclude').text().trim()).toBe('Flyout Content');
    });

    it('should be inactive after opening and calling close()', function () {
      $scope.flyoutActive = true;
      $scope.$apply();

      expect($element.find('div').children().hasClass('active')).toBe(true);

      var eltScope = $element.isolateScope();
      eltScope.close();
      eltScope.$apply();

      expect(eltScope.flyoutActive).toBe(false);
      expect($element.find('div').children().hasClass('active')).toBe(false);
    });

    it('should show custom icon if set', function () {
      $scope.flyoutCloseIcon = 'close-icon';
      $scope.$apply();

      expect($element.find('button').hasClass('close-icon')).toBeTruthy();
    });
  });

})();
