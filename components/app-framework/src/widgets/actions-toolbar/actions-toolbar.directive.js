(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('actionsToolbar', actionsToolbar);

  /**
   * @name actionsToolbar
   * @description An actions tool bar
   * @param {object} $window - Angular $window service
   * @param {object} $timeout - Angular $timeout service
   * @returns {*}
   */
  function actionsToolbar($window, $timeout) {
    return {
      bindToController: {
        items: '=',
        truncated: '=?',
        ready: '=?'
      },
      controller: ActionsToolbarController,
      controllerAs: 'actionsToolbarCtrl',
      templateUrl: 'framework/widgets/actions-toolbar/actions-toolbar.html',
      link: ActionsToolbarLink,
      scope: {}
    };

    function ActionsToolbarLink(scope, element, attrs, ctrl) {
      var resizeTimer;
      ctrl.lastVisibleItem = -1;

      // Check the toolbar to see if it all fits in view or not
      function checkForTruncation() {
        var h = element.get(0).offsetHeight + 4;
        var toolbar = element.find('.actions-toolbar');
        var w = toolbar.get(0).offsetWidth;
        ctrl.truncated = toolbar.get(0).scrollHeight > h;
        ctrl.lastVisibleItem = -1;
        if (ctrl.truncated) {
          // Truncated - calculate the last visible item
          var total = 0;
          var toolbarButtons = angular.element(toolbar).children();
          for (var i = 0; i < toolbarButtons.length; i++) {
            var item = toolbarButtons.get(i);
            total = total + item.offsetWidth;
            if (total > w) {
              ctrl.lastVisibleItem = i;
              break;
            }
          }
        }
      }

      function onResize() {
        $timeout.cancel(resizeTimer);
        resizeTimer = $timeout(function () {
          checkForTruncation();
        }, 150);

        // Ensure the menu is closed if the window is resized
        if (ctrl.closeMenuFn) {
          ctrl.closeMenuFn();
        }
      }

      angular.element($window).on('resize', onResize);
      // Ensure any app errors we have set are cleared when the scope is destroyed
      scope.$on('$destroy', function () {
        angular.element($window).off('resize', onResize);
      });

      // Check for the associated ready state changing
      scope.$watch(function () {
        return ctrl.ready;
      }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
          onResize();
        }
      });

      // Check for the items being hidden or shown or the list being changed
      scope.$watch(function () {
        var s = '';
        _.each(ctrl.items, function (item) {
          s += '(' + item.id || item.name;
          s += '-' + executeOrReturn(item, 'hidden') + '-' + executeOrReturn(item, 'disabled') + ')';
        });
        return s;
      }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
          onResize();
        }
      });

      scope.executeOrReturn = executeOrReturn;

      function executeOrReturn(action, property) {
        if (angular.isFunction(action[property])) {
          return action[property]();
        }
        return action[property];
      }
    }
  }

  function ActionsToolbarController() {
    var vm = this;

    // Before we open the menu, set the class to hide the items that are not truncated
    vm.onOpenMenu = function (e) {
      var el = angular.element(e);
      el.removeClass();
      if (vm.lastVisibleItem >= 0) {
        el.addClass('actions-toolbar-menu-hide-' + vm.lastVisibleItem);
      }
    };
  }

})();
