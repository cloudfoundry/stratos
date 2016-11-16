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
    'app.logged-in.loggedInService',
    '$state',
    '$rootScope',
    '$log'
  ];

  function registerModel(modelManager, eventService, loggedInService, $state, $rootScope, $log) {
    /**
     * Register 'app.model.navigation' with the model manager service.
     * This model hosts the application's navigation tree.
     */
    modelManager.register('app.model.navigation', new NavigationModel(eventService, loggedInService, $state, $rootScope, $log));
  }

  /**
   * @namespace app.model.NavigationModel
   * @memberof app.model
   * @name NavigationModel
   * @constructor
   * @param {app.event.eventService} eventService - the event bus service
   * @param {app.logged-in.loggedInService} loggedInService - the logged-in service
   * @param {object} $state - ui-router $state service
   * @param {object} $rootScope - Angular rootScope object
   * @param {object} $log - angular log service
   * @property {app.event.eventService} eventService - the event bus service
   * @property {object} $state - ui-router $state service
   * @property {app.model.navigation} menu - the navigation model
   */
  function NavigationModel(eventService, loggedInService, $state, $rootScope, $log) {
    var that = this;
    this.eventService = eventService;
    this.$state = $state;
    this.menu = new Menu($log);
    this.eventService.$on(this.eventService.events.LOGIN, function () {
      that.onLogin();
    });
    this.eventService.$on(this.eventService.events.LOGOUT, function () {
      that.onLogout();
    });
    this.eventService.$on(this.eventService.events.REDIRECT, function (event, state, params) {
      that.onAutoNav(event, state, params);
    });
    this.eventService.$on(this.eventService.events.TRANSFER, function (event, state, params) {
      that.$state.go(state, params, {location: false});
    });

    // Install a global state change handler
    // The rootScope never gets destroyed so we can safely ignore the eslint error
    $rootScope.$on('$stateChangeSuccess', function (event, toState) { // eslint-disable-line angular/on-watch
      // Activate the correct menu entry or deactivate all menu entries if none match
      that.menu.currentState = _.get(toState, 'data.activeMenuState', '');
      // Scroll to the console-view's top after a state transition
      var consoleViewScrollPanel = angular.element(document).find('#console-view-scroll-panel');
      if (consoleViewScrollPanel[0]) {
        consoleViewScrollPanel[0].scrollTop = 0;
      }
      loggedInService.userInteracted();
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
     * @param {object} params - optional params
     * @private
     */
    onAutoNav: function (event, state, params) {
      this.$state.go(state, params);
    }
  });

  /**
   * @namespace app.model.navigation.Menu
   * @memberof app.model.navigation
   * @name app.model.navigation.Menu
   * @param {object} $log - angular log service
   * @property {string} currentState - current ui-router state
   */
  function Menu($log) {
    this.currentState = null;
    this.$log = $log;
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
     * @param {number=} pos - optional position in the menu to insert at
     * @param {string=} icon - the icon of the menu item
     * @param {string=} baseState - optional href / ng-router top-level base state e.g. cf.applications or cf.workspaces
     *                              (defaults to name)
     * @returns {app.model.navigation.Menu} The navigation's Menu object
     */
    addMenuItem: function (name, href, text, pos, icon, baseState) {
      var item = {
        name: name,
        href: href,
        text: text,
        icon: icon,
        position: pos,
        // baseState is used to work out which menu entry is active based on any child state
        baseState: baseState || name, // defaults to name
        items: new Menu()   // sub-menu
      };

      return this._addMenuItem(item);
    },

    /**
     * @function addMenuItemFunction
     * @memberof app.model.navigation.Menu
     * @description Appends a new menu item into the menu list, where the menu item has a click handler.
     * @param {string} name - the name/ID of the menu item
     * @param {string} fn - the click handlerfor the menu item
     * @param {string} text - the displayed text of the menu item
     * @param {number=} pos - optional position in the menu to insert at
     * @param {string=} icon - the icon of the menu item
     * @returns {app.model.navigation.Menu} The navigation's Menu object
     */
    addMenuItemFunction: function (name, fn, text, pos, icon) {
      var item = {
        name: name,
        text: text,
        icon: icon,
        position: pos,
        onClick: fn,
        baseState: name,
        items: new Menu()   // sub-menu
      };

      return this._addMenuItem(item);
    },

    /**
     * @function _addMenuItem
     * @memberof app.model.navigation.Menu
     * @description Appends a new menu item into the menu list.
     * @param {object} item - the menu item
     * @returns {app.model.navigation.Menu} The navigation's Menu object
     * @private
     */
    _addMenuItem: function (item) {

      item.alignBottom = item.position < 0;
      if (item.position < 0) {
        item.position = 100 - item.position;
      }
      // Add item to the end
      var that = this;
      this.push(item);
      var sorted = _.sortBy(this, ['position', 'text']);
      this.length = 0;
      _.each(sorted, function (item) {
        that.push(item);
      });
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
