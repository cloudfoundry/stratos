import { CnsiEntitySource } from './cnsi-entity-source';
import type { StFeatureFlag } from '../endpoint-data/stratos-types';

// Per-CNSI source for the feature flags list. Reads
// /pp/v1/cf/feature_flags/{cnsi} — the backend handler drains
// pagination server-side. CF foundations expose ~15 flags so a
// single page is the common case, but the base class still walks
// pagination defensively.
export class CnsiFeatureFlagsSource extends CnsiEntitySource<StFeatureFlag> {
  protected readonly entityName = 'feature_flags';
}
