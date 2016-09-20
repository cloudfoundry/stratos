(function () {
  'use strict';

  describe('avatar directive', function () {
    var $element, avatarCtrl, $timeout, $document;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      var $scope = $injector.get('$rootScope').$new();
      var markup = '<avatar></avatar>';
      $timeout = $injector.get('$timeout');
      $document = $injector.get('$document');
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

      it('show actions - allow timeout to run hide', function () {
        avatarCtrl.showActions();
        $timeout.flush();
      });

      it('show actions - allow timeout to run hide - check off handler is installed', function () {
        avatarCtrl.showActions();
        avatarCtrl.showingActions = false;
        $timeout.flush();
      });

      it('show actions - check hide is called on click', function () {
        avatarCtrl.showActions();
        avatarCtrl.showingActions = false;
        $timeout.flush();
        $document.trigger('click');
      });
    });
  });

})();
