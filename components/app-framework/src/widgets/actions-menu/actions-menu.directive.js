(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('actionsMenu', actionsMenu);

  /**
   * @namespace app.framework.widgets.actionsMenu
   * @memberof app.framework.widgets
   * @name actionsMenu
   * @description An actions menu directive that displays
   * a dropdown menu with optional label. Each action should
   * contain a 'name' to be displayed and an 'execute' function
   * that will be called on click. If an action target is
   * provided, the action's execute function will be called with
   * the target as an argument.
   * @param {object} $document - jQuery wrapper for window.document
   * @example
   * var actions = [
   *   { name: 'Start', execute: function (target) { doSomething(target); } },
   *   { name: 'Stop', execute: function (target) { doSomething(target); } }
   * ];
   * <actions-menu actions="myController.actions">
   * </actions-menu>
   * @returns {object} The actions-menu directive definition object
   */
  function actionsMenu($document) {
    return {
      bindToController: {
        actionTarget: '=?',
        actions: '=',
        menuIcon: '@?',
        menuIconName: '@?',
        menuLabel: '@?',
        menuPosition: '@?',
        enableButtonMode: '=?',
        menuBeforeOpen: '=?',
        menuClose: '=?'
      },
      controller: ActionsMenuController,
      controllerAs: 'actionsMenuCtrl',
      link: function (scope, element, attrs, ctrl) {
        var enterKeyCode = 13;
        var iconElt = element.find('i');
        var clickAndNamespace = 'click.' + _.uniqueId('actionMenu');

        iconElt.on('click', function (event) {
          handleClick(event, scope, ctrl, element);
        });

        iconElt.on('keypress', function (event) {
          if (event.which === enterKeyCode) {
            handleClick(event, scope, ctrl, element);
          }
        });

        $document.on(clickAndNamespace, function (event) {
          if (!iconElt[0].contains(event.target) && ctrl.open) {
            scope.$apply(function () {
              ctrl.open = false;
            });
          }
        });

        scope.$on('$destroy', function () {
          iconElt.off('click');
          iconElt.off('keypress');
          $document.off(clickAndNamespace);
        });
      },
      restrict: 'E',
      scope: {},
      templateUrl: 'framework/widgets/actions-menu/actions-menu.html'
    };

    function handleClick(event, scope, ctrl, element) {
      if (!ctrl.open) {
        if (ctrl.menuBeforeOpen) {
          ctrl.menuBeforeOpen(element);
        }
        $document.triggerHandler('click');
      }

      scope.$apply(function () {
        ctrl.open = !ctrl.open;
      });
      event.stopPropagation();
    }
  }

  /**
   * @namespace app.framework.widgets.ActionsMenuController
   * @memberof app.framework.widgets
   * @name ActionsMenuController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @property {string} icon - the actions menu icon
   * @property {string} position - the actions menu position
   * @property {boolean} open - flag whether actions menu should be visible
   * @property {boolean} buttonMode - do not show the drop down instead the single action as a button
   */
  function ActionsMenuController($scope) {
    var vm = this;

    // Optional extra classes (e.g. to change size of icon)
    vm.icon = vm.menuIcon || '';
    vm.position = vm.menuPosition || '';
    vm.open = false;
    vm.buttonMode = false;
    vm.menuIconName = vm.menuIconName || 'more_horiz';

    vm.executeAction = executeAction;
    vm.executeOrReturn = executeOrReturn;

    $scope.$watch(function () {
      if (vm.actions && vm.actions.length > 0) {
        return _.countBy(vm.actions, function (action) {
          return !!executeOrReturn(action, 'hidden');
        }).false;
      }
      return 0;
    }, function (visibleActions) {
      vm.visibleActions = visibleActions > 0;
      vm.buttonMode = vm.enableButtonMode && visibleActions === 1;
    });

    // Allow the menu to be closed by the user of the directive
    vm.menuClose = function () {
      vm.open = false;
    };

    /**
     * @function executeAction
     * @memberof app.framework.widgets.ActionsMenuController
     * @description Execute the action's function on click and
     * close the menu.
     * @param {object} $event - the event object
     * @param {object} action - the action object
     * @returns {void}
     */
    function executeAction($event, action) {
      if (!executeOrReturn(action, 'disabled')) {
        action.execute(vm.actionTarget);
        this.open = false;
      }
      $event.stopPropagation();
    }

    function executeOrReturn(action, property) {
      if (angular.isFunction(action[property])) {
        return action[property]();
      }
      return action[property];
    }

  }

})();
