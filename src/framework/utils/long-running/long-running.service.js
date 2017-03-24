(function () {
  'use strict';

  angular
    .module('helion.framework.utils')
    .factory('helion.framework.utils.long-running.service', serviceFactory);

  serviceFactory.$inject = [
    '$q', '$timeout'
  ];

  /**
   * serviceFactory factory of the service
   * @param {object} $q - angular $q service
   * @param {function} $timeout - angular $timeout service
   * @returns {function} longRunning service
   * @example
   *
   ```js
   // inject 'helion.framework.utils.long-running.service' as longRunning here

   var interval = 3000;

   longRunning(function () {
     return someApi.someMethod(); // returns a promise
   }, interval)

   // repeats invoke the async long-time-running operation
   // if it returned with a `response` object that does not
   // meet a certain condition.

   .until(function (response) {
       return response.data.foo !== null; // returns boolean
     })

   // executes this function when the `until` function return `true`,
   // pass in the same arguments as the one passed to until function.

   .then(function (response) {
       myDataModel.foo = response.data.foo;
     });
   ```
   */
  function serviceFactory($q, $timeout) {
    return longRunning;

    /**
     * @name longRunning
     * @description longRunning service
     * @param {function} operation  - operation function
     * @param {number} interval - interval in ms
     * @returns {{until: until}}
     */
    function longRunning(operation, interval) {
      var conditionFn;
      var deferred = $q.defer();

      loop();
      return {
        until: until
      };

      /**
       * specify condition check function to terminate the async loop
       * @param {function} func - the condition checking function
       * @returns {promise}
       */
      function until(func) {
        conditionFn = func;
        return deferred.promise;
      }

      /**
       * An async loop
       */
      function loop() {
        $timeout(function () {
          operation().then(function (data) {
            if (conditionFn(data)) {
              deferred.resolve(data);
            } else {
              loop();
            }
          },
            loop);
        }, interval);
      }
    }
  }

})();
