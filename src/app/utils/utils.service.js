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
   * @param {object} $log - the angular $log service
   * @description Various utility functions
   * @param {object} $log - the Angular $log service
   * @returns {object} the utils service
   */
  function utilsServiceFactory($log) {
    return {
      mbToHumanSize: mbToHumanSize,
      startStateResolve: startStateResolve,
      chainStateResolve: chainStateResolve,
      getClusterEndpoint: getClusterEndpoint
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
     * @param {string} stateName - the name of the state chaining its initialization
     * @param {Object} $state - The ui-router $state service
     * @param {function} initFunc - The promise returning init function for setting up the current state
     * */
    function chainStateResolve(stateName, $state, initFunc) {
      var aState = $state.get(stateName);
      var previousPromise = _.get($state.current, 'data.initialized');
      var thisPromise;
      if (_.isUndefined(previousPromise)) {
        $log.warn('Whoops! Init promise chain started instead of chaining by state: ' + aState.name);
        thisPromise = initFunc();
      } else {
        // Note: we may chain on ourselves when re-entering, this is ok
        $log.debug('Init promise chain continued from state: ' + previousPromise._state + ' by: ' + aState.name);
        thisPromise = previousPromise.then(initFunc);
      }
      thisPromise._state = aState.name;
      aState.data.initialized = thisPromise;
    }

    /**
     * Begin a state resolve promise chain which can then be used in chainStateResolve
     * @param {string} stateName - the name of the state chaining its initialization
     * @param {Object} $state - The ui-router $state service
     * @param {function} initFunc - The promise returning init function for setting up the current state
     * */
    function startStateResolve(stateName, $state, initFunc) {
      var aState = $state.get(stateName);
      $log.debug('Init promise chain started by: ' + aState.name);
      var p = initFunc();
      p._state = aState.name;
      _.set(aState, 'data.initialized', p);
    }

    function getClusterEndpoint(cluster) {
      if (!cluster) {
        return '';
      }
      return cluster.api_endpoint.Scheme + '://' + cluster.api_endpoint.Host;
    }

  }

})();
