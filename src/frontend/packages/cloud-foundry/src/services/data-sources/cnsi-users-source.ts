import { CnsiEntitySource } from './cnsi-entity-source';
import type { StUser } from '../endpoint-data/stratos-types';

// Per-CNSI source for users. Reads /pp/v1/cf/users/{cnsi}, which the
// backend handler fully drains server-side — both /v3/users and /v3/roles
// arrive joined into one paged envelope. The CnsiEntitySource base class
// still walks pagination defensively in case CAPI/Jetstream ever surfaces
// per_page-bounded responses; the backend always returns a single fully
// drained page today.
//
// Reserved for future use — the CF-level / per-space user pages currently
// fetch the StUsersResponse shape directly via CfUsersSignalConfigService.
// This source exists for parity with cnsi-routes-source / cnsi-service-
// instances-source so a multi-CNSI users wall can plug in later without
// reshaping the contract.
export class CnsiUsersSource extends CnsiEntitySource<StUser> {
  protected readonly entityName = 'users';
}
