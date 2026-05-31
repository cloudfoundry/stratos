import { describe, it, expect } from 'vitest';

import { MonocularVersion } from '../../../helm/store/helm.types';
import { firstNonDevelopmentVersion, isReleaseVersion } from './helm-release-versions.helpers';

const v = (version: string): MonocularVersion => ({ attributes: { version } } as MonocularVersion);

describe('helm release-versions helpers', () => {
  describe('isReleaseVersion', () => {
    it('treats a plain semver as a release version', () => {
      expect(isReleaseVersion(v('4.16.0'))).toBe(true);
    });

    it('treats a hyphenated pre-release as a development version', () => {
      expect(isReleaseVersion(v('4.16.0-beta.1'))).toBe(false);
    });
  });

  describe('firstNonDevelopmentVersion', () => {
    it('returns the first release (non-hyphenated) version in the list', () => {
      const versions = [v('5.0.0-rc.1'), v('4.16.0'), v('4.15.0')];
      expect(firstNonDevelopmentVersion(versions)).toBe(versions[1]);
    });

    it('falls back to the first entry when every version is a pre-release', () => {
      const versions = [v('5.0.0-rc.1'), v('5.0.0-rc.2')];
      expect(firstNonDevelopmentVersion(versions)).toBe(versions[0]);
    });

    it('returns undefined for an empty list', () => {
      expect(firstNonDevelopmentVersion([])).toBeUndefined();
    });
  });
});
