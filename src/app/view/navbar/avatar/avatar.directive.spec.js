(function () {
  'use strict';

  describe('avatar directive', function () {
    var $element, avatarCtrl;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      var markup = '<avatar></avatar>';

      $element = angular.element(markup);
      $compile($element)($scope);
      $scope.$apply();

      avatarCtrl = $element.controller('avatar');
    }));

    it('should be defined', function () {
      expect($element).toBeDefined();
    });

    describe('An AvatarController instance', function () {
      it('should be defined', function () {
        expect(avatarCtrl).toBeDefined();
      });

      // property definitions

      it('should have properties `accountModel` defined', function () {
        expect(avatarCtrl.accountModel).toBeDefined();
      });

      it('should have properties `showingActions` defined', function () {
        expect(avatarCtrl.showingActions).toBeDefined();
      });

      it('should have properties `showingActions` defined as false by default', function () {
        expect(avatarCtrl.showingActions).toBe(false);
      });

      // method definitions

      it('should have method `showActions` defined', function () {
        expect(angular.isFunction(avatarCtrl.showActions)).toBe(true);
      });

      // method invocation

      it('invoke `showActions`', function () {
        avatarCtrl.showingActions = false;
        avatarCtrl.showActions();
        expect(avatarCtrl.showingActions).toBe(true);
      });

    });

  });

})();
