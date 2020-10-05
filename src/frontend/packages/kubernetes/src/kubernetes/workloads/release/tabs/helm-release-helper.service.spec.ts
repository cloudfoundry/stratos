import { Version } from './helm-release-helper.service';

describe('HelmReleaseHelperService', () => {

  describe('Version', () => {

    const v10 = new Version('1.0.0');
    const v11 = new Version('1.1.0');
    const v11rc1 = new Version('1.0.0-rc.1');
    const v11rc2 = new Version('1.0.0-rc.2');
    const v201 = new Version('2.0.1');
    const v101 = new Version('1.0.1');

    it('version comparisons', () => {
      expect(v11.isNewer(v10)).toBe(true);
      expect(v11rc1.isNewer(v11)).toBe(false);
      expect(v11rc2.isNewer(v11rc1)).toBe(true);
      expect(v201.isNewer(v11)).toBe(true);
      expect(v201.isNewer(v11rc1)).toBe(true);
      expect(v10.isNewer(v11)).toBe(false);
      expect(v101.isNewer(v11)).toBe(false);
      expect(v101.isNewer(v10)).toBe(true);

      expect(v11rc1.isNewer(v10)).toBe(false);

    });
  });
});
