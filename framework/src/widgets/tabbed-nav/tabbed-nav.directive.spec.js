(function () {
  'use strict';

  describe('tabbed-nav directive', function () {
    var element, tabbedNavCtrl;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      $scope.routes = [
        {label: 'Route 1', state: 'route1'},
        {label: 'Route 2', state: 'route2'}
      ];

      var markup = '<tabbed-nav routes="routes" view-name="viewName"></tabbed-nav>';

      element = angular.element(markup);
      $compile(element)($scope);

      $scope.$apply();

      tabbedNavCtrl = element.controller('tabbedNav');
    }));

    it('should be defined', function () {
      expect(element).toBeDefined();
    });

    it('should have routes defined', function () {
      expect(tabbedNavCtrl.routes.length).toBe(2);
    });

    it('should have viewName defined', function () {
      expect(tabbedNavCtrl.viewName).toBe('viewName');
    });

    it('should have two items in nav', function () {
      expect(element.find('li').length).toBe(2);
    });
  });

})();
