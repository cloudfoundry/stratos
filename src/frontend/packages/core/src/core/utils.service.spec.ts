import { inject, TestBed } from '@angular/core/testing';

import { pathGet, pathSet, safeStringToObj, safeUnsubscribe, UtilsService } from './utils.service';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(() => {
    service = new UtilsService();
    TestBed.configureTestingModule({
      providers: [UtilsService]
    });
  });

  it('should be injectable', inject([UtilsService], (svc: UtilsService) => {
    expect(svc).toBeTruthy();
  }));

  describe('#bytesToHumanSize', () => {
    it('should return formatted string', () => {
      expect(service.bytesToHumanSize('123')).toBe('123 B');
      expect(service.bytesToHumanSize('123123')).toBe('120.2 kB');
      expect(service.bytesToHumanSize('12312333')).toBe('11.7 MB');
      expect(service.bytesToHumanSize('12312313133')).toBe('11.5 GB');
      expect(service.bytesToHumanSize('123123134423133')).toBe('112 TB');
    });

    it('should return empty string', () => {
      expect(service.bytesToHumanSize('')).toBe('');
      expect(service.bytesToHumanSize(null)).toBe('');
    });

    it('should return unlimited char when -1', () => {
      expect(service.bytesToHumanSize('-1')).toBe('∞');
    });
  });

  describe('#mbToHumanSize', () => {
    it('should return formatted string', () => {
      expect(service.mbToHumanSize(0)).toBe('0 MB');
      expect(service.mbToHumanSize(123)).toBe('123 MB');
      expect(service.mbToHumanSize(123123)).toBe('120.2 GB');
      expect(service.mbToHumanSize(12312333)).toBe('11.7 TB');
    });

    it('should return empty string', () => {
      expect(service.mbToHumanSize(null)).toBe('');
    });

    it('should return unlimited char when -1', () => {
      expect(service.mbToHumanSize(-1)).toBe('∞');
    });
  });

  describe('#precisionIfUseful', () => {
    it('should return default precision', () => {
      expect(service.precisionIfUseful(123.22)).toBe(123.2);
      expect(service.precisionIfUseful(123123.00)).toBe(123123);
    });
  });

  describe('#usageBytes', () => {
    it('should return empty value', () => {
      expect(service.usageBytes(0)).toBe('-');
      expect(service.usageBytes(Number.POSITIVE_INFINITY)).toBe('-');
      expect(service.usageBytes(NaN)).toBe('-');
      expect(service.usageBytes([])).toBe('-');
    });

    it('should return formatted string', () => {
      expect(service.usageBytes([2, 20])).toBe('2 / 20 bytes');
      expect(service.usageBytes([22, 20000])).toBe('22 / 20 kB');
      expect(service.usageBytes([222, 2000000])).toBe('222 / 2 MB');
      expect(service.usageBytes([2222, 200000000])).toBe('2 kB / 191 MB');
      expect(service.usageBytes([2222, 20000000000])).toBe('2 kB / 19 GB');
      expect(service.usageBytes([222222222, 20000000000000])).toBe('212 MB / 18 TB');
    });
  });

  describe('#formatUptime', () => {
    it('should return empty value if invalid', () => {
      expect(service.formatUptime(undefined)).toBe('-');
      expect(service.formatUptime(NaN)).toBe('-');
      expect(service.formatUptime(null)).toBe('-');
    });

    it('should return 0s if now', () => {
      expect(service.formatUptime(0)).toBe('0s');
    });

    it('should return formatted value', () => {
      expect(service.formatUptime(23)).toBe('23s');
      expect(service.formatUptime(60)).toBe('1m');
      expect(service.formatUptime(3600)).toBe('1h');
      expect(service.formatUptime(3600 * 24)).toBe('1d');
      expect(service.formatUptime(3600 * 24 + 3600 + 60)).toBe('1d 1h 1m');
      expect(service.formatUptime(12312313)).toBe('142d 12h 5m 13s');
    });
  });

  describe('#percent', () => {
    it('should return empty string if invalid value', () => {
      expect(service.percent(null)).toBe('');
      expect(service.percent(NaN)).toBe('');
      expect(service.percent(undefined)).toBe('');
    });

    it('should format precision if passed', () => {
      expect(service.percent(0, 1)).toBe('0.0%');
      expect(service.percent(0, 0)).toBe('0%');
    });

    it('should return formatted string', () => {
      expect(service.percent(0)).toBe('0.00%');
      expect(service.percent(0.23)).toBe('23.00%');
      expect(service.percent(0.123)).toBe('12.30%');
    });
  });

  describe('#pathGet', () => {
    it('should return value from inner object path', () => {
      expect(pathGet('a', { a: { } })).toEqual({});
      expect(pathGet('a.c', { a: { c: 'a'} })).toBe('a');
      expect(pathGet('a.b.c', { a: { b: { c: 1 } } })).toBe(1);
    });

    it('should return undefined if inexistent path', () => {
      expect(pathGet('a.d', { a: { b: { c: 1 } } })).toBe(undefined);
      expect(pathGet('a.b.c', {})).toBe(undefined);
      expect(pathGet('a', null)).toBe(undefined);
      expect(pathGet('a', undefined)).toBe(undefined);
      expect(pathGet('a.b.c', { a: { b: {}}})).toBe(undefined);
    });
  });

  describe('#pathSet', () => {
    it('should set object value based on path ', () => {
      const obj: any = { a: { b: {} } };
      pathSet('a.b', obj, 1);

      expect(obj.a.b).toBe(1);
    });

    it('should throw exception if path doesnt exist', () => {
      expect(() => pathSet('a.b', {}, 1)).toThrowError();
    });
  });

  describe('#safeStringToObj', () => {
    it('should convert json obj string to object', () => {
      expect(safeStringToObj('{}')).toEqual({});
    });

    it('should return null if invalid json', () => {
      expect(safeStringToObj('asd')).toBe(null);
      expect(safeStringToObj('0')).toBe(null);
      expect(safeStringToObj('[]')).toBe(null);
    });
  });

  describe('#safeUnsubscribe', () => {
    it('should call unsubscribe method from objects', () => {
      const spy = jasmine.createSpyObj('subscriber', ['unsubscribe']);
      const spy2 = jasmine.createSpyObj('subscriber', ['unsubscribe']);
      safeUnsubscribe(spy, spy2);

      expect(spy.unsubscribe).toHaveBeenCalled();
      expect(spy2.unsubscribe).toHaveBeenCalled();
    });
  });
});
