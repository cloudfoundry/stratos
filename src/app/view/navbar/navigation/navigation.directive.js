(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('navigation', navigation);

  navigation.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.navigation
   * @memberof app.view
   * @name navigation
   * @description A navigation UI component directive
   * @param {string} path - the application base path
   * @returns {object} The navigation directive definition object
   */
  function navigation(path) {
    return {
      controller: NavigationController,
      controllerAs: 'navigationCtrl',
      templateUrl: path + '/view/navbar/navigation/navigation.html'
    };
  }

  NavigationController.$inject = [
    '$state',
    'app.event.eventService',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.NavigationController
   * @memberof app.view
   * @name NavigationController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {object} $state - ui-router $state service
   * @property {app.event.eventService} eventService - the event bus service
   * @property {app.model.navigation} menu - the navigation model
   * @property {string} currentState - current ui-router state
   */
  function NavigationController($state, eventService, modelManager) {
    this.$state = $state;
    this.eventService = eventService;
    this.menu = modelManager.retrieve('app.model.navigation');
    this.currentState = null;
    this.eventService.$on(this.eventService.events.AUTO_NAV, this.onAutoNav.bind(this));
  }

  angular.extend(NavigationController.prototype, {
    /**
     * @function onAutoNav
     * @memberof app.view.navigation.NavigationController
     * @description automatic navigating event handler
     * @param event {object} angular event object
     * @param state {string} the state to navigate to
     * @private
     */
    onAutoNav: function (event, state) {
      this.$state.go(state);
      this.currentState = state;
    }
  });

})();
