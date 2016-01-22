(function () {
  'use strict';

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
   * @namespace Menu
   * @name Menu
   */
  function Menu() {}

  Menu.prototype = [];

  angular.extend(Menu.prototype, {
    /**
     * @function addMenuItem
     * @memberof Menu
     * @description Appends a new menu item into the menu list. Each menu item
     * is a sub-menu which is also of type Menu and is empty initially.
     * @param {string} name - the name/ID of the menu item
     * @param {string} href - the href / ng-router state
     * @param {string} text - the displayed text of the menu item
     * @param {string} icon - the icon of the menu item
     * @returns {Menu}
     *
     * Each menu item has a sub-menu defined is `items`.
     */
    addMenuItem: function (name, href, text, icon) {
      this.push({
        name: name,
        href: href,
        text: text,
        icon: icon,
        items: new Menu()
      });
      return this;
    },

    /**
     * @function reset
     * @memberof Menu
     * @description Clear the menu list
     * @returns {Menu}
     */
    reset: function () {
      this.length = 0;
      return this;
    }
  });

})();
