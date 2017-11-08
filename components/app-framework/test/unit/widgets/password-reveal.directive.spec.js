(function () {
  'use strict';

  describe('password-reveal directive', function () {
    var $compile, contextScope, element;

    beforeEach(module('templates'));
    beforeEach(module('app.framework'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      contextScope = $injector.get('$rootScope').$new();
      var markup = '<input type="password" ng-model="password" password-reveal></input>';
      contextScope.password = '';
      element = angular.element(markup);
      $compile(element)(contextScope);
      contextScope.$apply();
    }));

    it('should be defined', function () {
      expect(element).toBeDefined();
    });

    it('should toggle', function () {
      expect(element.attr('type')).toBe('password');
      var eyeIcon = element.next();
      expect(eyeIcon).toBeDefined();
      eyeIcon.click();
      expect(element.attr('type')).toBe('text');
      eyeIcon.click();
      expect(element.attr('type')).toBe('password');
    });
  });
})();

