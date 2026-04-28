import { CnsiEntitySource } from './cnsi-entity-source';
import type { StSpaceQuota } from '../endpoint-data/stratos-types';

// Per-CNSI source for the space quotas list. Reads
// /pp/v1/cf/space_quotas/{cnsi} — the backend handler drains
// pagination server-side. Each quota is owned by exactly one org and
// may be applied to any number of spaces in that org.
export class CnsiSpaceQuotasSource extends CnsiEntitySource<StSpaceQuota> {
  protected readonly entityName = 'space_quotas';
}
