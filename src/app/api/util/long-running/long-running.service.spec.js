(function () {
  'use strict';

  describe('app.api.long-running.service', function () {
    var $q, $timeout, longRunning;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      $timeout = $injector.get('$timeout');
      longRunning = $injector.get('app.api.long-running.service');
    }));

    it('defines the service as a function.', function () {
      expect(angular.isFunction(longRunning)).toBe(true);
    });

    it('works properly.', function () {
      var complete = false;
      var c = 0;

      longRunning(function () {
        return $q(function (resolve) {
          $timeout(function () {
            if (c++ < 3) {
              resolve({ data: {} });
            } else {
              resolve({ data: { foo: 'bar' } });
            }
          }, 200);
        });
      }, 3000)
        .until(function (response) {
          return response.data.foo === 'bar';
        })
        .then(function () {
          complete = true;
        });

      $timeout.flush();
      $timeout.flush();
      expect(complete).toBe(false);

      $timeout.flush();
      $timeout.flush();

      expect(complete).toBe(false);

      $timeout.flush();
      $timeout.flush();
      expect(complete).toBe(false);

      $timeout.flush();
      $timeout.flush();
      expect(complete).toBe(true);
    });
  });
})();
