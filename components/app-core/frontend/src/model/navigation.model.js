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

  function registerModel(modelManager, appEventService, appLoggedInService, $state, $rootScope, $log) {
    /**
     * Register 'app.model.navigation' with the model manager service.
     * This model hosts the application's navigation tree.
     */
    modelManager.register('app.model.navigation', new NavigationModel(appEventService, appLoggedInService, $state, $rootScope, $log));
  }

  /**
   * @namespace app.model.NavigationModel
   * @memberof app.model
   * @name NavigationModel
   * @param {app.utils.appEventService} appEventService - the application event service
   * @param {app.utils.appLoggedInService} appLoggedInService - the application logged in service
   * @param {$state} $state - the Angular $state service
   * @param {$rootScope} $rootScope - the Angular $rootScope service
   * @param {$log} $log - the Angular $log service
   * @constructor
   * @property {app.model.navigation} menu - the navigation model
   */
  function NavigationModel(appEventService, appLoggedInService, $state, $rootScope, $log) {
    var menu = new Menu($log);
    var bottomMenu = new Menu($log);

    var navModel = {
      menu: menu,
      secondary: [],
      user: new Menu($log),
      bottomMenu: bottomMenu,
      secondaryMenus: {},
      getSecondaryMenu: getSecondaryMenu,
      clearSecondary: clearSecondary,
      createSecondaryMenu: createSecondaryMenu
    };

    appEventService.$on(appEventService.events.LOGIN, function () {
      onLogin();
      updateSecondaryNav();
    });
    appEventService.$on(appEventService.events.LOGOUT, function () {
      onLogout();
    });
    appEventService.$on(appEventService.events.REDIRECT, function (event, state, params) {
      onAutoNav(event, state, params);
    });
    appEventService.$on(appEventService.events.TRANSFER, function (event, state, params) {
      $state.go(state, params, {location: false});
    });

    // Install a global state change handler
    // The rootScope never gets destroyed so we can safely ignore the eslint error
    $rootScope.$on('$stateChangeSuccess', function (event, toState) { // eslint-disable-line angular/on-watch
      // Activate the correct menu entry or deactivate all menu entries if none match
      menu.currentState = _.get(toState, 'data.activeMenuState', '');
      // The full state name
      menu.absoluteState = toState.name;
      menu.secondaryMenuState = _.get(toState, 'data.secondaryMenuState', '');

      updateSecondaryNav();

      // Scroll to the console-view's top after a state transition
      var consoleViewScrollPanel = angular.element(document).find('#console-view-scroll-panel');
      if (consoleViewScrollPanel[0]) {
        consoleViewScrollPanel[0].scrollTop = 0;
      }
      appLoggedInService.userInteracted();
    });

    return navModel;

    function updateSecondaryNav() {
      if (menu.secondaryMenuState) {
        if (navModel.secondaryMenus[menu.secondaryMenuState]) {
          navModel.secondary = navModel.secondaryMenus[menu.secondaryMenuState];
        } else {
          navModel.secondary = [];
        }
      } else {
        navModel.secondary = [];
      }
    }

    function createSecondaryMenu(stateName) {
      if (!stateName) {
        stateName = $state.current.name;
      }
      var newMenu = getSecondaryMenu(stateName);
      newMenu.reset();

      // Check if we are creating the secondary nav for the currently active state
      updateSecondaryNav();
      return newMenu;
    }

    function clearSecondary() {
      navModel.secondary = new Menu($log);
      return navModel.secondary;
    }

    function getSecondaryMenu(stateName) {
      if (!navModel.secondaryMenus[stateName]) {
        navModel.secondaryMenus[stateName] = new Menu($log);
      }
      return navModel.secondaryMenus[stateName];
    }

    function reset() {
      menu.reset();
      bottomMenu.reset();
      navModel.secondary = {};
    }

    /**
     * @function onLogin
     * @memberof app.model.NavigationModel
     * @description login event handler
     * @private
     */
    function onLogin() {
      reset();
    }

    /**
     * @function onLogout
     * @memberof app.model.NavigationModel
     * @description logout event handler
     * @private
     */
    function onLogout() {
      reset();
    }

    /**
     * @function onAutoNav
     * @memberof app.model.NavigationModel
     * @description automatic navigating event handler
     * @param {object} event - angular event object
     * @param {string} state - the state to navigate to
     * @param {object} params - optional params
     * @private
     */
    function onAutoNav(event, state, params) {
      $state.go(state, params);
    }
  }

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
     * @function getMenuItem
     * @memberof app.model.navigation.Menu
     * @description Gets the menu item with the specified name
     * @param {string} name - the name/ID of the menu item
     * @returns {object} Menu item for the specified item
     */
    getMenuItem: function (name) {
      return _.find(this, {name: name});
    },

    /**
     * @function addMenuItem
     * @memberof app.model.navigation.Menu
     * @description Appends a new menu item into the menu list. Each menu item
     * is a sub-menu which is also of type Menu and is empty initially.
     * @param {string} name - the name/ID of the menu item
     * @param {string} href - the href / ng-router state we go to when clicking the entry.
     * @param {string} text - the displayed text of the menu item
     * @param {number=} pos - optional position in the menu to insert at
     * @param {string=} icon - the icon of the menu item
     * @param {string=} baseState - optional href / ng-router top-level base state e.g. endpoint (defaults to name)
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

      if (item.icon) {
        item.svgIcon = item.icon.indexOf('svg://') === 0;
        if (item.svgIcon) {
          item.icon = 'svg/' + item.icon.substr(6);
        }
      }
      return item;
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
