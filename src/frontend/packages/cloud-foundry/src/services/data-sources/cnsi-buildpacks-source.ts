import { CnsiEntitySource } from './cnsi-entity-source';
import type { StBuildpack } from '../endpoint-data/stratos-types';

// Per-CNSI source for the buildpacks list. Reads /pp/v1/cf/buildpacks/{cnsi}
// — the backend handler drains pagination server-side. CF foundations
// typically expose 10–30 buildpacks so a single page is the common case,
// but the base class still walks pagination defensively.
export class CnsiBuildpacksSource extends CnsiEntitySource<StBuildpack> {
  protected readonly entityName = 'buildpacks';
}
