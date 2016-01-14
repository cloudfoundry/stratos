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
     * @name 'app.model.navigation'
     * @description
     *
     * This model hosts application navigation tree.
     */
    modelManager.register('app.model.navigation', new Menu());
  }

  function Menu() {}

  Menu.prototype = [];

  angular.extend(Menu.prototype, {
    /**
     * Appends a new menu item into the menu list.
     * @param name {String} used to identify the item.
     * @param href {String} the href / ng-router state.
     * @param text {String} display text.
     * @returns {Menu}
     *
     * Each menu item has a sub-menu defined is `items`.
     */
    addMenuItem: function (name, href, text) {
      this.push({
        name: name,
        href: href,
        text: text,
        items: new Menu()
      });
      return this;
    },

    /**
     * Cleans up menu items.
     * @returns {Menu}
     */
    reset: function () {
      this.length = 0;
      return this;
    }
  });

})();
