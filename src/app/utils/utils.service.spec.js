(function () {
  'use strict';

  describe('utils service', function () {
    var utils, mbToHumanSizeFilter, $q, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      utils = $injector.get('app.utils.utilsService');
      mbToHumanSizeFilter = $injector.get('mbToHumanSizeFilter');
      $q = $injector.get('$q');
      $scope = $injector.get('$rootScope');
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

  });

})();
