(function () {
  'use strict';

  angular
    .module('app.utils')
    .factory('app.utils.utilsService', utilsServiceFactory);

  utilsServiceFactory.$inject = [
    '$log'
  ];

  /**
   * @namespace app.utils.utilsService
   * @memberof app.utils
   * @name utilsService
   * @description Various utility functions
   * @returns {object} the utils service
   */
  function utilsServiceFactory($log) {
    return {
      mbToHumanSize: mbToHumanSize,
      chainStateResolve: chainStateResolve
    };

    function mbToHumanSize(sizeMb) {
      if (angular.isUndefined(sizeMb)) {
        return '';
      }
      if (sizeMb === -1) {
        return '∞';
      }
      if (sizeMb > 1048576) {
        return (sizeMb / 1048576).toFixed(1) + ' TB';
      }
      if (sizeMb > 1024) {
        return (sizeMb / 1024).toFixed(1) + ' GB';
      }
      return sizeMb + ' MB';
    }

    /**
     * Chain promise returning init functions for ensuring in-order Controller initialisation of nested states
     * NB: this uses custom state data to mimick ui-router's resolve functionality.
     * Unfortunately we cannot reliably use ui-router's built-in resolve because of the way we register plugins
     * during the run phase instead of the config phase.
     * @param {Object} $state - The ui-router $state for the current state
     * @param {function} initFunc - The promise returning init function for setting up the current state
     * */
    function chainStateResolve($state, initFunc) {
      $state.current.data = $state.current.data || {};
      var parentPromise = $state.current.data.initialized;
      var thisPromise;
      if (_.isUndefined(parentPromise)) {
        $log.debug('Init promise chain starting from state ' + $state.current.name);
        thisPromise = initFunc();
      } else {
        $log.debug('Init promise chain continued by state ' + $state.current.name);
        thisPromise = parentPromise.then(initFunc);
      }
      $state.current.data.initialized = thisPromise;
    }

  }

})();
