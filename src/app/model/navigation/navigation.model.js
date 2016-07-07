(function () {
  'use strict';

  /**
   * @namespace app.model.navigation
   * @memberOf app.model
   * @name navigation
   * @description Navigation model
   */
  angular
    .module('app.model')
    .run(registerModel);

  registerModel.$inject = [
    'app.model.modelManager',
    'app.event.eventService',
    '$state',
    '$rootScope'
  ];

  function registerModel(modelManager, eventService, $state, $rootScope) {
    /**
     * Register 'app.model.navigation' with the model manager service.
     * This model hosts the application's navigation tree.
     */
    modelManager.register('app.model.navigation', new NavigationModel(eventService, $state, $rootScope));
  }

  /**
   * @namespace app.model.NavigationModel
   * @memberof app.model
   * @name NavigationModel
   * @constructor
   * @param {app.event.eventService} eventService - the event bus service
   * @param {object} $state - ui-router $state service
   * @param {object} $rootScope - Angular rootScope object
   * @property {app.event.eventService} eventService - the event bus service
   * @property {object} $state - ui-router $state service
   * @property {app.model.navigation} menu - the navigation model
   */
  function NavigationModel(eventService, $state, $rootScope) {
    var that = this;
    this.eventService = eventService;
    this.$state = $state;
    this.menu = new Menu();
    this.eventService.$on(this.eventService.events.LOGIN, function () {
      that.onLogin();
    });
    this.eventService.$on(this.eventService.events.LOGOUT, function () {
      that.onLogout();
    });
    this.eventService.$on(this.eventService.events.REDIRECT, function (event, state) {
      that.onAutoNav(event, state);
    });

    // Install a global state change handler
    // The rootScope never gets destroyed so we can safely ignore the eslint error
    $rootScope.$on('$stateChangeSuccess', function (event, toState) { // eslint-disable-line angular/on-watch
      // Set currentState on our menu
      if (toState.data) {
        that.menu.currentState = toState.data.activeMenuState;
      }
      // Scroll to the console-view's top after a state transition
      var consoleView = angular.element(document).find('console-view');
      if (consoleView[0]) {
        consoleView[0].scrollTop = 0;
      }
    });
  }

  angular.extend(NavigationModel.prototype, {
    /**
     * @function onLogin
     * @memberof app.model.NavigationModel
     * @description login event handler
     * @private
     */
    onLogin: function () {
      this.menu.reset();
    },

    /**
     * @function onLogout
     * @memberof app.model.NavigationModel
     * @description logout event handler
     * @private
     */
    onLogout: function () {
      this.menu.reset();
    },

    /**
     * @function onAutoNav
     * @memberof app.model.NavigationModel
     * @description automatic navigating event handler
     * @param {object} event - angular event object
     * @param {string} state - the state to navigate to
     * @private
     */
    onAutoNav: function (event, state) {
      this.$state.go(state);
    }
  });

  /**
   * @namespace app.model.navigation.Menu
   * @memberof app.model.navigation
   * @name app.model.navigation.Menu
   * @property {string} currentState - current ui-router state
   */
  function Menu() {
    this.currentState = null;
  }

  // Using an array as the prototype
  Menu.prototype = [];

  angular.extend(Menu.prototype, {
    /**
     * @function addMenuItem
     * @memberof app.model.navigation.Menu
     * @description Appends a new menu item into the menu list. Each menu item
     * is a sub-menu which is also of type Menu and is empty initially.
     * @param {string} name - the name/ID of the menu item
     * @param {string} href - the href / ng-router state we go to when clicking the entry.
     *                        e.g. cf.applications.list.gallery-view
     * @param {string} text - the displayed text of the menu item
     * @param {string} icon - the icon of the menu item
     * @param {string=} baseState - optional href / ng-router top-level base state e.g. cf.applications or cf.workspaces
     *                              (defaults to name)
     * @param {number} pos - optional position in the menu to insert at
     * @returns {app.model.navigation.Menu} The navigation's Menu object
     */
    addMenuItem: function (name, href, text, icon, baseState, pos) {
      var item = {
        name: name,
        href: href,
        text: text,
        icon: icon,
        // baseState is used to work out which menu entry is active based on any child state
        baseState: baseState || name, // defaults to name
        items: new Menu()   // sub-menu
      };
      if (angular.isNumber(pos)) {
        this.splice(pos, 0, item);
      } else {
        this.push(item);
      }

      return this;
    },

    /**
     * @function reset
     * @memberof app.model.navigation.Menu
     * @description Clear the menu list
     * @returns {app.model.navigation.Menu} The navigation's Menu object
     */
    reset: function () {
      this.length = 0;
      return this;
    }
  });

})();
