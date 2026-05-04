import { CnsiEntitySource } from './cnsi-entity-source';
import type { StOrgQuota } from '../endpoint-data/stratos-types';

// Per-CNSI source for the org quotas list. Reads
// /pp/v1/cf/organization_quotas/{cnsi} — the backend handler drains
// pagination server-side. CF foundations expose a small number of
// named org quotas so a single page is the common case.
export class CnsiOrgQuotasSource extends CnsiEntitySource<StOrgQuota> {
  protected readonly entityName = 'organization_quotas';
}
