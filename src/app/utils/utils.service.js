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
    '$window'
  ];

  /**
   * @namespace app.utils.utilsService
   * @memberof app.utils
   * @name utilsService
   * @description Various utility functions
   * @param {object} $q - the Angular $q service
   * @param {object} $timeout - the Angular $timeout service
   * @param {object} $log - the Angular $log service
   * @param {object} $window - angular $window service
   * @returns {object} the utils service
   */
  function utilsServiceFactory($q, $timeout, $log, $window) {
    var UNIT_GRABBER = /([0-9.]+)( .*)/;

    /*
     * Expression used to validate URLs in the Endpoint registration form.
     * Expression explanation available from https://gist.github.com/dperini/729294
     * Passes the following criteria: https://mathiasbynens.be/demo/url-regex
     *
     */
    var urlValidationExpression = new RegExp(
      '^' +
      // protocol identifier
      'http(s)?://' +
      // user:pass authentication
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:' +
      // IP address exclusion
      // private & local networks
      '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
      '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
      '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
      '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
      '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
      '|' +
      // host name
      '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
      // domain name
      '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
      // TLD identifier
      '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
      // TLD may end with dot
      '\\.?' +
      ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:[/?#]\\S*)?' +
      '$', 'i'
    );

    var colorCodes = {
      black: 0,
      red: 1,
      green: 2,
      yellow: 3,
      blue: 4,
      magenta: 5,
      cyan: 6,
      white: 7
    };

    // Ansi code to reset all colours
    var RESET = '\x1B[0m';

    return {
      chainStateResolve: chainStateResolve,
      getClusterEndpoint: getClusterEndpoint,
      bytesToHumanSize: bytesToHumanSize,
      mbToHumanSize: mbToHumanSize,
      retryRequest: retryRequest,
      runInSequence: runInSequence,
      sizeUtilization: sizeUtilization,
      urlValidationExpression: urlValidationExpression,
      extractCloudFoundryError: extractCloudFoundryError,
      extractCodeEngineError: extractCodeEngineError,
      getOemConfiguration: getOemConfiguration,
      coloredLog: coloredLog,
      highlightLog: highlightLog
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

    function bytesToHumanSize(sizeB) {
      if (angular.isUndefined(sizeB)) {
        return '';
      }
      if (sizeB === -1) {
        return '∞';
      }
      if (sizeB >= 1099511627776) {
        return precisionIfUseful(sizeB / 1099511627776) + ' TB';
      }
      if (sizeB >= 1073741824) {
        return precisionIfUseful(sizeB / 1073741824) + ' GB';
      }
      if (sizeB >= 1048576) {
        return precisionIfUseful(sizeB / 1048576) + ' MB';
      }
      if (sizeB >= 1024) {
        return precisionIfUseful(sizeB / 1024) + ' kB';
      }
      return precisionIfUseful(sizeB) + ' B';
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

    function coloredLog(message, color, boldOn) {
      if (boldOn) {
        if (color) {
          return '\x1B[1;3' + colorCodes[color] + 'm' + message + RESET;
        }
        return '\x1B[1m' + message + RESET;
      }
      if (color) {
        return '\x1B[3' + colorCodes[color] + 'm' + message + RESET;
      }
      return message;
    }

    function highlightLog(message, previousColour, wasBoldOn) {
      var ret = '\x1B[0;4' + colorCodes.yellow + ';30m' + message + RESET;
      if (previousColour) {
        ret += '\x1B[3' + previousColour + 'm';
      }
      if (wasBoldOn) {
        ret += '\x1B[1m';
      }
      return ret;
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

      var thisPromise;

      var wrappedCatch = function (error) {
        $log.error('Failed to initialise state. This may result in missing or incorrect data.', error);
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
      };
    }

    function getClusterEndpoint(cluster) {
      if (!cluster) {
        return '';
      }
      return cluster.api_endpoint.Scheme + '://' + cluster.api_endpoint.Host;
    }

    function getOemConfiguration() {
      return $window.env.OEM_CONFIG;
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

  function extractCloudFoundryError(errorResponse) {
    /*
     Cloud Foundry errors have the following format:
     data: {
     description: 'some text',
     errorCode: 1000,
     error_code: 'UnknownHostException'
     }
     */
    var errorText;

    if (_.isUndefined(errorResponse) || _.isNull(errorResponse)) {
      return;
    }
    if (errorResponse.data && errorResponse.data.error_code) {
      errorResponse = errorResponse.data;
    }

    if (errorResponse.description && _.isString(errorResponse.description)) {
      errorText = errorResponse.description;
    }

    if (errorResponse.error_code && _.isString(errorResponse.error_code)) {
      errorText = errorText + gettext(', Error Code: ') + errorResponse.error_code;
    }

    return errorText;
  }

  function extractCodeEngineError(errorResponse) {

    /*
     Code Engine errors have the following format
     data: {
     message: 'some text',
     detail: 'more text',
     }
     */

    if (_.isUndefined(errorResponse) || _.isNull(errorResponse)) {
      return;
    }
    var errorText;
    if (errorResponse.data && errorResponse.data.message) {
      errorResponse = errorResponse.data;
    }

    if (errorResponse.message && _.isString(errorResponse.message)) {
      errorText = errorResponse.message;
      if (errorResponse.details || errorResponse.detail) {
        var detail = errorResponse.details || errorResponse.detail;
        if (_.isString(detail)) {
          errorText = errorText + ', ' + detail;
        }
      }
    }

    return errorText;
  }

})();
