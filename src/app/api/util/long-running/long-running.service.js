(function () {
  'use strict';

  angular
    .module('app.api')
    .factory('app.api.long-running.service', serviceFactory);

  /**
   *
   ```js

   // inject 'app.api.long-running.service' as longRunning here

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
  serviceFactory.$inject = [
    '$q', '$timeout'
  ];

  function serviceFactory($q, $timeout) {
    return longRunning;

    function longRunning(operation, interval) {
      var conditionFn, deferred = $q.defer();
      loop();
      return {
        until: until
      };

      function until(func) {
        conditionFn = func;
        return deferred.promise;
      }

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
