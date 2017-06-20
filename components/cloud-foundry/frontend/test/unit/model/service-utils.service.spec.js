(function () {
  'use strict';

  describe('service utils service', function () {
    var cfServiceUtils;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));
    beforeEach(inject(function ($injector) {
      cfServiceUtils = $injector.get('cfServiceUtils');
    }));

    it('should be defined', function () {
      expect(cfServiceUtils).toBeDefined();
    });

    it('should have enhance function', function () {
      expect(cfServiceUtils.enhance).toBeDefined();
    });

    it('should cope with null and undefined', function () {
      expect(cfServiceUtils.enhance(null)).toBe(null);
      expect(cfServiceUtils.enhance(undefined)).toBe(undefined);
    });

    it('should check bindable flag', function () {
      var service = {
        entity: {
          bindable: 0
        }
      };

      cfServiceUtils.enhance(service);
      expect(service._bindTarget).not.toBeDefined();
    });

    it('should detect app bindable service without requires', function () {
      var service = {
        entity: {
          bindable: 1
        }
      };

      cfServiceUtils.enhance(service);
      expect(service._bindTarget).toBeDefined();
      expect(service._bindTarget).toBe('APP');
    });

    it('should detect app bindable service with requires', function () {
      var service = {
        entity: {
          bindable: 1,
          requires: ['resource1', 'resource2']
        }
      };

      cfServiceUtils.enhance(service);
      expect(service._bindTarget).toBeDefined();
      expect(service._bindTarget).toBe('APP');
    });

    it('should detect route bindable service', function () {
      var service = {
        entity: {
          bindable: 1,
          requires: ['resource1', 'route_forwarding', 'resource2']
        }
      };

      cfServiceUtils.enhance(service);
      expect(service._bindTarget).toBeDefined();
      expect(service._bindTarget).toBe('ROUTE');
    });

    it('should enahnce arrays of services', function () {
      var service1 = {
        entity: {
          bindable: 1,
          requires: ['resource1', 'route_forwarding', 'resource2']
        }
      };
      var service2 = {
        entity: {
          bindable: 0
        }
      };
      var service3 = {
        entity: {
          bindable: 1
        }
      };

      var enhanced = cfServiceUtils.enhance([service1, service2, service3]);
      expect(enhanced.length).toBeDefined();
      expect(enhanced.length).toBe(3);
      expect(enhanced[0]._bindTarget).toBeDefined();
      expect(enhanced[0]._bindTarget).toBe('ROUTE');
      expect(enhanced[1]._bindTarget).not.toBeDefined();
      expect(enhanced[2]._bindTarget).toBeDefined();
      expect(enhanced[2]._bindTarget).toBe('APP');
    });

  });

})();
