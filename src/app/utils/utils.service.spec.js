(function () {
  'use strict';

  describe('utils service', function () {
    var utils, mbToHumanSizeFilter, $q, $scope, $timeout;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      utils = $injector.get('app.utils.utilsService');
      mbToHumanSizeFilter = $injector.get('mbToHumanSizeFilter');
      $q = $injector.get('$q');
      $scope = $injector.get('$rootScope');
      $timeout = $injector.get('$timeout');
    }));

    it('should be defined', function () {
      expect(utils).toBeDefined();
      expect(mbToHumanSizeFilter).toBeDefined();
    });

    it('should return URL', function () {
      expect(utils.getClusterEndpoint()).toBe('');
      var cluster = {
        api_endpoint: {
          Scheme: 'http',
          Host: 'cluster.com'
        }
      };
      expect(utils.getClusterEndpoint(cluster)).toBe('http://cluster.com');
    });

    describe('mb formatting', function () {

      it('should format undefined', function () {
        expect(utils.mbToHumanSize()).toBe('');
      });

      it('should format -1', function () {
        expect(utils.mbToHumanSize(-1)).toBe('∞');
      });

      it('should format TB', function () {
        expect(utils.mbToHumanSize(1048577)).toBe('1 TB');
      });

      it('should format GB', function () {
        expect(utils.mbToHumanSize(2049)).toBe('2 GB');
      });

      it('should format MB', function () {
        expect(utils.mbToHumanSize(27)).toBe('27 MB');
      });

      it('should work as a filter', function () {
        expect(mbToHumanSizeFilter(5000)).toBe('4.9 GB');
      });

    });

    describe('size utilization formatting', function () {

      it('should format value out of infinity', function () {
        expect(utils.sizeUtilization(1, -1)).toBe('1 MB / ∞');
      });

      it('should format value', function () {
        expect(utils.sizeUtilization(12, 2049)).toBe('12 MB / 2 GB');
      });

      it('should format value with same units', function () {
        expect(utils.sizeUtilization(1025, 2049)).toBe('1 / 2 GB');
      });

    });

    describe('retryRequest', function () {
      var calls;
      beforeEach(function () {
        calls = 0;
      });

      function createRequestPromise(attemptsNeeded) {
        var a = attemptsNeeded;
        return function () {
          calls++;
          a = a - 1;
          if (a > 0) {
            return $q.reject('FAILED');
          } else {
            return $q.resolve('OK');
          }
        };
      }

      it('should not need to retry', function () {
        var result = utils.retryRequest(createRequestPromise(0), 3, 0);
        result.catch(function () {
          fail();
        });
        $scope.$apply();
        $timeout.flush();
        expect(calls).toBe(1);
      });

      it('should need to retry', function () {
        var result = utils.retryRequest(createRequestPromise(2), 3, 0);
        result.catch(function () {
          fail();
        });

        $scope.$apply();
        $timeout.flush();
        expect(calls).toBe(2);
      });

      it('should need to retry - needs 6 retries', function () {
        var result = utils.retryRequest(createRequestPromise(6), 3, 0);
        result.then(function () {
          fail();
        });
        $scope.$apply();
        $timeout.flush();
        $scope.$apply();
        $timeout.flush();
        expect(calls).toBe(3);
      });
    });

    describe('runInSequence', function () {
      it('should run in sequence', function () {
        var results = '';
        var createFunction = function (text) {
          return function () {
            return $q.when(text).then(function (value) {
              results += value;
            });
          };
        };

        var tasks = [
          createFunction('task-1'),
          createFunction('task-2'),
          createFunction('task-3'),
          createFunction('task-4')
        ];

        utils.runInSequence(tasks, false).then(function () {
          expect(results).toBe('task-4task-3task-2task-1');
        }).catch(function () {
          fail();
        });

        $scope.$apply();
      });

      it('should run in sequence as queue', function () {
        var results = '';
        var createFunction = function (text) {
          return function () {
            return $q.when(text).then(function (value) {
              results += value;
            });
          };
        };

        var tasks = [
          createFunction('task-1'),
          createFunction('task-2'),
          createFunction('task-3'),
          createFunction('task-4')
        ];

        utils.runInSequence(tasks, true).then(function () {
          expect(results).toBe('task-1task-2task-3task-4');
        }).catch(function () {
          fail();
        });

        $scope.$apply();
      });
    });

    describe('URL Validation tests', function () {

      var regExp;

      beforeEach(function () {
        regExp = utils.urlValidationExpression;
      });

      it('should validate these urls', function () {
        expect(regExp.test('https://api.hcf.hscdemo.com')).toBe(true);
        expect(regExp.test('https://api.hcf.hscdemo.com:8080')).toBe(true);
        expect(regExp.test('https://hce.hscdemo.com:8080')).toBe(true);
        expect(regExp.test('https://api.192.168.20.nip.io')).toBe(true);
      });

      it('should fail these urls', function () {
        expect(regExp.test('https://api.hcf.hscdemo.c')).toBe(false);
        expect(regExp.test('https://api.hcf.hscdemo.com:7:')).toBe(false);
        expect(regExp.test('https://.....hce.hscdemo.com:8080')).toBe(false);
        expect(regExp.test('https://api.192.168.20.nip.io....')).toBe(false);
      });

    });

  });

})();
