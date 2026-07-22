import { MonocularVersion } from '../../../helm/store/helm.types';

// A "release" version is a plain version with no pre-release suffix (no
// hyphen), e.g. `4.16.0`. Development/pre-release builds (`4.16.0-rc.1`)
// are hidden unless the user opts into "All Versions".
export function isReleaseVersion(version: MonocularVersion): boolean {
  return version.attributes.version.indexOf('-') === -1;
}

// The upgrade picker defaults its radio selection to the newest release
// version; if the chart only publishes pre-releases, fall back to the
// first entry so something is always selectable.
export function firstNonDevelopmentVersion(versions: MonocularVersion[]): MonocularVersion | undefined {
  return versions.find(isReleaseVersion) ?? versions[0];
}
