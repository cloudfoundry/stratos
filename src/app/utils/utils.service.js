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
   * @param {object} $log - the Angular $log service
   * @returns {object} the utils service
   */
  function utilsServiceFactory($log) {
    var UNIT_GRABBER = /([0-9.]+)( .*)/;

    return {
      mbToHumanSize: mbToHumanSize,
      sizeUtilization: sizeUtilization,
      chainStateResolve: chainStateResolve,
      getClusterEndpoint: getClusterEndpoint
    };

    function precisionIfUseful(size, precision) {
      if (angular.isUndefined(precision)) {
        precision = 1;
      }
      var floored = Math.floor(size);
      if (floored === size) {
        return floored;
      }
      return size.toFixed(precision);
    }

    function mbToHumanSize(sizeMb) {
      if (angular.isUndefined(sizeMb)) {
        return '';
      }
      if (sizeMb === -1) {
        return '∞';
      }
      if (sizeMb > 1048576) {
        return precisionIfUseful(sizeMb / 1048576) + ' TB';
      }
      if (sizeMb > 1024) {
        return precisionIfUseful(sizeMb / 1024) + ' GB';
      }
      return precisionIfUseful(sizeMb) + ' MB';
    }

    function sizeUtilization(sizeMbUsed, sizeMbTotal) {
      var usedMemHuman = this.mbToHumanSize(sizeMbUsed);
      var totalMemHuman = this.mbToHumanSize(sizeMbTotal);

      var usedUnit = UNIT_GRABBER.exec(usedMemHuman);
      var totalUnit = UNIT_GRABBER.exec(totalMemHuman);
      if (usedUnit[2] === totalUnit[2] || usedUnit[1] === '0') {
        usedMemHuman = usedUnit[1];
      }

      return usedMemHuman + ' / ' + totalMemHuman;
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
      var promiseStack = _.get($state.current, 'data.initialized');

      var thisPromise;
      if (_.isUndefined(promiseStack)) {
        $log.debug('Promise stack undefined, initialized by state: ' + aState.name);
        aState.data.initialized = [];
        thisPromise = initFunc();
      } else if (promiseStack.length < 1) {
        $log.debug('Promise stack empty, initialized by state: ' + aState.name);
        thisPromise = initFunc();
      } else {
        var previousPromise = promiseStack[promiseStack.length - 1];
        $log.debug('Init promise chain continued from state: ' + previousPromise._state + ' by: ' + aState.name);
        thisPromise = previousPromise.then(initFunc);
      }

      thisPromise._state = aState.name;
      aState.data.initialized.push(thisPromise);

      aState.onExit = function () {
        $log.debug('Cleaning up obsolete promise from state: ' + aState.name);
        var index = aState.data.initialized.indexOf(aState);
        aState.data.initialized.splice(index, 1);
      };
    }

    function getClusterEndpoint(cluster) {
      if (!cluster) {
        return '';
      }
      return cluster.api_endpoint.Scheme + '://' + cluster.api_endpoint.Host;
    }

  }

})();
