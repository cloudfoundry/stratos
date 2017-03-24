(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('actionsMenu', actionsMenu);

  actionsMenu.$inject = [
    'helion.framework.basePath',
    '$document'
  ];

  /**
   * @namespace helion.framework.widgets.actionsMenu
   * @memberof helion.framework.widgets
   * @name actionsMenu
   * @description An actions menu directive that displays
   * a dropdown menu with optional label. Each action should
   * contain a 'name' to be displayed and an 'execute' function
   * that will be called on click. If an action target is
   * provided, the action's execute function will be called with
   * the target as an argument.
   * @param {string} path - the framework base path
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
  function actionsMenu(path, $document) {
    return {
      bindToController: {
        actionTarget: '=?',
        actions: '=',
        menuIcon: '@?',
        menuLabel: '@?',
        menuPosition: '@?',
        enableButtonMode: '=?'
      },
      controller: ActionsMenuController,
      controllerAs: 'actionsMenuCtrl',
      link: function (scope, element, attrs, ctrl) {
        var enterKeyCode = 13;
        var iconElt = element.find('i');
        var clickAndNamespace = 'click.' + _.uniqueId('actionMenu');

        iconElt.on('click', function (event) {
          handleClick(event, scope, ctrl);
        });

        iconElt.on('keypress', function (event) {
          if (event.which === enterKeyCode) {
            handleClick(event, scope, ctrl);
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
      templateUrl: path + 'widgets/actions-menu/actions-menu.html'
    };

    function handleClick(event, scope, ctrl) {
      if (!ctrl.open) {
        $document.triggerHandler('click');
      }

      scope.$apply(function () {
        ctrl.open = !ctrl.open;
      });
      event.stopPropagation();
    }
  }

  ActionsMenuController.$inject = ['$scope'];

  /**
   * @namespace helion.framework.widgets.ActionsMenuController
   * @memberof helion.framework.widgets
   * @name ActionsMenuController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @property {string} icon - the actions menu icon
   * @property {boolean} position - the actions menu position
   * @property {boolean} open - flag whether actions menu should be visible
   * @property {boolean} buttonMode - do not show the drop down instead the single action as a button
   */
  function ActionsMenuController($scope) {
    var that = this;

    this.icon = this.menuIcon || 'glyphicon glyphicon-option-horizontal';
    this.position = this.menuPosition || '';
    this.open = false;
    this.buttonMode = false;

    if (this.enableButtonMode) {
      $scope.$watch(function () {
        if (that.actions && that.actions.length > 1) {
          var hidden = _.countBy(that.actions, function (action) {
            return !!action.hidden;
          }).true;
          return that.actions.length - (hidden ? hidden : 0) > 1;
        }
        return false;
      }, function (moreThanOneVisibleAction) {
        that.buttonMode = !moreThanOneVisibleAction;
      });
    }
  }

  angular.extend(ActionsMenuController.prototype, {
    /**
     * @function executeAction
     * @memberof helion.framework.widgets.ActionsMenuController
     * @description Execute the action's function on click and
     * close the menu.
     * @param {object} $event - the event object
     * @param {object} action - the action object
     * @returns {void}
     */
    executeAction: function ($event, action) {
      if (!action.disabled) {
        action.execute(this.actionTarget);
        this.open = false;
      }
      $event.stopPropagation();
    }
  });

})();
