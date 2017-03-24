(function () {
  'use strict';

  describe('auto-populate-input directive', function () {
    var $element;

    beforeEach(module('helion.framework.utils'));
    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      var markup = '<auto-populate-input to="test_to" from="test_from"></auto-populate-input>';
      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();
    }));

    it('should be defined', function () {
      var ctrl = $element.controller('autoPopulateInput');
      expect($element).toBeDefined();
      expect(ctrl).toBeDefined();
    });

    it('should be defined and have attributes set', function () {
      var ctrl = $element.controller('autoPopulateInput');
      expect($element).toBeDefined();
      expect(ctrl).toBeDefined();
      expect(ctrl.to).toBe('test_to');
      expect(ctrl.from).toBe('test_from');
      expect(ctrl).toBeDefined();
    });
  });
})();
