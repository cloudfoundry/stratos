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

      it('should have properties `model` defined', function () {
        expect(avatarCtrl.model).toBeDefined();
      });

      it('should have properties `showActions` defined', function () {
        expect(avatarCtrl.model).toBeDefined();
      });

      it('should have properties `showActions` defined as false by default', function () {
        expect(avatarCtrl.showActions).toBe(false);
      });

      // method definitions

      it('should have method `showHideActions` defined', function () {
        expect(angular.isFunction(avatarCtrl.showHideActions)).toBe(true);
      });

      // method invocation

      it('invoke `showHideActions`', function () {
        avatarCtrl.showActions = false;
        avatarCtrl.showHideActions();
        expect(avatarCtrl.showActions).toBe(true);

        avatarCtrl.showActions = true;
        avatarCtrl.showHideActions();
        expect(avatarCtrl.showActions).toBe(false);
      });

    });

  });

})();
