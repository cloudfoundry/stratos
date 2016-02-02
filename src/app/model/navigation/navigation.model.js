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
    'app.model.modelManager'
  ];

  function registerModel(modelManager) {
    /**
     * Register 'app.model.navigation' with the model manager service.
     * This model hosts the application's navigation tree.
     */
    modelManager.register('app.model.navigation', new Menu());
  }

  /**
   * @namespace app.model.navigation.Menu
   * @memberof app.model.navigation
   * @name app.model.navigation.Menu
   */
  function Menu() {}

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
