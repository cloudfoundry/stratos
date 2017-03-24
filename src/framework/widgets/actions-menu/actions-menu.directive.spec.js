(function () {
  'use strict';

  describe('actions-menu directive', function () {
    var $compile, $document;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $document = $injector.get('$document');

      spyOn($document, 'triggerHandler').and.callThrough();
    }));

    describe('with default settings', function () {
      var $scope, element, actionsMenuCtrl;

      beforeEach(inject(function ($injector) {
        $scope = $injector.get('$rootScope').$new();
        $scope.mockActions = [
          {
            name: 'Action 1', execute: angular.noop
          },
          {
            name: 'Action 2', execute: angular.noop
          }
        ];

        var markup = '<actions-menu actions="mockActions"></actions-menu>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        actionsMenuCtrl = element.controller('actionsMenu');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should be initially hidden', function () {
        expect(actionsMenuCtrl.open).toBe(false);
      });

      it('should use default icon for actions menu', function () {
        expect(actionsMenuCtrl.icon).toBe('glyphicon glyphicon-option-horizontal');
      });

      it('should use default position for actions menu', function () {
        expect(actionsMenuCtrl.position).toBe('');
      });

      it('should show menu when icon clicked', function () {
        element.find('i').triggerHandler('click');
        expect(actionsMenuCtrl.open).toBe(true);
        expect($document.triggerHandler).toHaveBeenCalledWith('click');
      });

      it('should show menu when enter key pressed on icon', function () {
        element.find('i').triggerHandler({type: 'keypress', which: 13});
        expect(actionsMenuCtrl.open).toBe(true);
        expect($document.triggerHandler).toHaveBeenCalledWith('click');
      });

      it('should show menu when non-enter key pressed on icon', function () {
        element.find('i').triggerHandler({type: 'keypress', which: 21});
        expect(actionsMenuCtrl.open).toBe(false);
      });

      it('should toggle menu when icon clicked', function () {
        element.find('i').triggerHandler('click');
        expect(actionsMenuCtrl.open).toBe(true);

        $scope.$apply();
        $document.triggerHandler.calls.reset();

        element.find('i').triggerHandler('click');
        expect(actionsMenuCtrl.open).toBe(false);
        expect($document.triggerHandler).not.toHaveBeenCalled();
      });

      it('should dismiss menu when clicking outside menu and icon', function () {
        element.find('i').triggerHandler('click');
        expect(actionsMenuCtrl.open).toBe(true);

        $scope.$apply();

        var target = angular.element('<div></div>')[0];
        $document.triggerHandler({type: 'click', target: target});
        expect(actionsMenuCtrl.open).toBe(false);
      });

      it('should not dismiss menu when clicking on icon', function () {
        actionsMenuCtrl.open = true;

        var icon = element.find('i')[0];
        $document.triggerHandler({type: 'click', target: icon});
        expect(actionsMenuCtrl.open).toBe(true);
      });

      it('should not execute function when disabled action clicked', function () {
        actionsMenuCtrl.open = true;

        var mockAction = {name: 'action', execute: angular.noop, disabled: true};
        var mockEvent = {stopPropagation: angular.noop};
        spyOn(mockAction, 'execute');
        spyOn(mockEvent, 'stopPropagation');

        actionsMenuCtrl.executeAction(mockEvent, mockAction);
        expect(mockAction.execute).not.toHaveBeenCalled();
        expect(actionsMenuCtrl.open).toBe(true);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('with custom options', function () {
      var $scope, element, actionsMenuCtrl;

      beforeEach(inject(function ($injector) {
        $scope = $injector.get('$rootScope').$new();
        $scope.mockActions = [
          {
            name: 'Action 1', execute: angular.noop
          },
          {
            name: 'Action 2', execute: angular.noop
          }
        ];
        $scope.actionTarget = {name: 'target'};

        var markup = '<actions-menu actions="mockActions" action-target="actionTarget" ' +
          'menu-icon="icon" menu-label="label" menu-position="right">' +
          '</actions-menu>';

        element = angular.element(markup);
        $compile(element)($scope);

        $scope.$apply();

        actionsMenuCtrl = element.controller('actionsMenu');
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });

      it('should use specified icon for actions menu', function () {
        expect(actionsMenuCtrl.icon).toBe('icon');
      });

      it('should use specified position for actions menu', function () {
        expect(actionsMenuCtrl.position).toBe('right');
      });

      it('should display the menu label', function () {
        var label = angular.element(element.find('li')[0]);
        expect(label.text().trim()).toBe('label');
      });

      it('should execute function on menu item click', function () {
        var mockAction = {name: 'action', execute: angular.noop};
        var mockEvent = {stopPropagation: angular.noop};
        spyOn(mockAction, 'execute');
        spyOn(mockEvent, 'stopPropagation');

        actionsMenuCtrl.executeAction(mockEvent, mockAction);
        expect(mockAction.execute).toHaveBeenCalled();
        expect(actionsMenuCtrl.open).toBe(false);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
      });
    });
  });

})();
