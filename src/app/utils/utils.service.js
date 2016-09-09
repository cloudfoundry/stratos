(function () {
  'use strict';

  angular
    .module('app.utils')
    .factory('app.utils.utilsService', utilsServiceFactory)
    .filter('mbToHumanSize', mbToHumanSizeFilter);

  utilsServiceFactory.$inject = [
    '$q',
    '$timeout',
    '$log',
    'helion.framework.widgets.toaster'
  ];

  /**
   * @namespace app.utils.utilsService
   * @memberof app.utils
   * @name utilsService
   * @description Various utility functions
   * @param {object} $q - the Angular $q service
   * @param {object} $timeout - the Angular $timeout service
   * @param {object} $log - the Angular $log service
   * @param {helion.framework.widgets.toaster} toaster - the helion framework toaster service
   * @returns {object} the utils service
   */
  function utilsServiceFactory($q, $timeout, $log, toaster) {
    var UNIT_GRABBER = /([0-9.]+)( .*)/;

    return {
      chainStateResolve: chainStateResolve,
      getClusterEndpoint: getClusterEndpoint,
      mbToHumanSize: mbToHumanSize,
      retryRequest: retryRequest,
      runInSequence: runInSequence,
      sizeUtilization: sizeUtilization
    };

    /**
     * @function retryRequest
     * @memberOf app.utils.utilsService
     * @description Retries promise until max tries reached
     * @param {object} requestPromise - a function returning a promise object
     * @param {number} maxRetries - max retries
     * @param {number} waitTime - wait time between requests
     * @returns {promise} A promise that will be resolved or rejected later
     */
    function retryRequest(requestPromise, maxRetries, waitTime) {
      var deferred = $q.defer();
      var requestsMade = 1;
      maxRetries = maxRetries || 3;

      var timeout = null;
      var request = function () {
        requestPromise().then(function (response) {
          deferred.resolve(response);
        }, function (response) {
          if (requestsMade < maxRetries) {
            requestsMade++;
            if (timeout) {
              $timeout.cancel(timeout);
            }

            timeout = $timeout(function () {
              request();
            }, waitTime || 5000);
          } else {
            deferred.reject(response);
          }
        });
      };

      request();

      return deferred.promise;
    }

    /**
     * @function runInSequence
     * @memberOf app.utils.utilsService
     * @description runs async functions in sequence
     * @param {object} funcStack - a stack containing async functions
     * @param {boolean} asQueue - optional, indicting to treat the funcStack as a queue
     * @returns {promise} a promise that will be resolved or rejected later
     */
    function runInSequence(funcStack, asQueue) {
      if (asQueue) {
        funcStack.reverse();
      }

      return $q(function (resolve, reject) {
        (function _doIt() {
          if (!funcStack.length) {
            resolve();
            return;
          }
          var func = funcStack.pop();
          func().then(_doIt, reject);
        })();
      });
    }

    function precisionIfUseful(size, precision) {
      if (angular.isUndefined(precision)) {
        precision = 1;
      }
      var floored = Math.floor(size);
      var fixed = Number(size.toFixed(precision));
      if (floored === fixed) {
        return floored;
      }
      return fixed;
    }

    function mbToHumanSize(sizeMb) {
      if (angular.isUndefined(sizeMb)) {
        return '';
      }
      if (sizeMb === -1) {
        return '∞';
      }
      if (sizeMb >= 1048576) {
        return precisionIfUseful(sizeMb / 1048576) + ' TB';
      }
      if (sizeMb >= 1024) {
        return precisionIfUseful(sizeMb / 1024) + ' GB';
      }
      return precisionIfUseful(sizeMb) + ' MB';
    }

    function sizeUtilization(sizeMbUsed, sizeMbTotal) {
      var usedMemHuman = this.mbToHumanSize(sizeMbUsed);
      var totalMemHuman = this.mbToHumanSize(sizeMbTotal);

      var usedUnit = UNIT_GRABBER.exec(usedMemHuman);
      var totalUnit = UNIT_GRABBER.exec(totalMemHuman);
      if (usedUnit && totalUnit && usedUnit[2] === totalUnit[2] || usedUnit && usedUnit[1] === '0') {
        usedMemHuman = usedUnit[1];
      }

      return usedMemHuman + ' / ' + totalMemHuman;
    }

    // Wrap val into a promise if it's not one already
    // N.B. compared with using $q.resolve(val) directly,
    // this avoids creating an additional deferred if val was already a promise
    function _wrapPromise(val) {
      if (val && angular.isFunction(val.then)) {
        return val;
      }
      return $q.resolve(val);
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

      var toast, thisPromise;

      var wrappedCatch = function (error) {
        toast = toaster.warning(gettext('Failed to initialise state. This may result in missing or incorrect data. Please refresh your browser to try again.'), {
          timeOut: 0,
          extendedTimeOut: 0,
          closeButton: false
        });
        return $q.reject(error);
      };

      if (_.isUndefined(promiseStack)) {
        promiseStack = [];
        aState.data.initialized = promiseStack;
      }
      if (promiseStack.length < 1) {
        $log.debug('Promise stack empty, starting chain from state: ' + aState.name);
        thisPromise = _wrapPromise(initFunc()).catch(wrappedCatch);
      } else {
        var previousPromise = promiseStack[promiseStack.length - 1];
        $log.debug('Init promise chain continued from state: ' + previousPromise._state + ' by: ' + aState.name);
        thisPromise = previousPromise.then(function () {
          return _wrapPromise(initFunc()).catch(wrappedCatch);
        });
      }

      thisPromise._state = aState.name;
      aState.data.initialized.push(thisPromise);

      aState.onExit = function () {
        $log.debug('Cleaning up obsolete promise from state: ' + aState.name);
        var index = aState.data.initialized.indexOf(aState);
        aState.data.initialized.splice(index, 1);
        if (toast) {
          $timeout(function () {
            toaster.clear(toast);
          }, 15000);
        }
      };
    }

    function getClusterEndpoint(cluster) {
      if (!cluster) {
        return '';
      }
      return cluster.api_endpoint.Scheme + '://' + cluster.api_endpoint.Host;
    }
  }

  mbToHumanSizeFilter.$inject = [
    'app.utils.utilsService'
  ];

  function mbToHumanSizeFilter(utilsService) {
    return function (input) {
      return utilsService.mbToHumanSize(input);
    };
  }
})();
