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
    '$state'
  ];

  function registerModel(modelManager, eventService, $state) {
    /**
     * Register 'app.model.navigation' with the model manager service.
     * This model hosts the application's navigation tree.
     */
    modelManager.register('app.model.navigation', new NavigationModel(eventService, $state));
  }

  /**
   * @namespace app.model.NavigationModel
   * @memberof app.model
   * @name NavigationModel
   * @constructor
   * @param {app.event.eventService} eventService - the event bus service
   * @param {object} $state - ui-router $state service
   * @property {app.event.eventService} eventService - the event bus service
   * @property {object} $state - ui-router $state service
   * @property {app.model.navigation} menu - the navigation model
   */
  function NavigationModel(eventService, $state) {
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
  }

  angular.extend(NavigationModel.prototype, {
    /**
     * @function onLogin
     * @memberof app.model.NavigationModel
     * @description login event handler
     * @private
     * @returns {void}
     */
    onLogin: function () {
      this.menu.reset();
    },

    /**
     * @function onLogout
     * @memberof app.model.NavigationModel
     * @description logout event handler
     * @private
     * @returns {void}
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
     * @returns {void}
     */
    onAutoNav: function (event, state) {
      this.$state.go(state);
      this.menu.currentState = state;
    }
  });

  /**
   * @namespace app.model.navigation.Menu
   * @memberof app.model.navigation
   * @name app.model.navigation.Menu
   * @property {string} currentState - current ui-router state
   * @returns {void}
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
     * @param {string} href - the href / ng-router state
     * @param {string} text - the displayed text of the menu item
     * @param {string} icon - the icon of the menu item
     * @returns {app.model.navigation.Menu} The navigation's Menu object
     */
    addMenuItem: function (name, href, text, icon) {
      this.push({
        name: name,
        href: href,
        text: text,
        icon: icon,
        items: new Menu()   // sub-menu
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
