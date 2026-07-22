import { APIResource } from '@stratosui/store';

import { IOrganization } from '../../cf-api.types';
import { StOrg } from './stratos-types';

// Adapter from V3-native StOrg (signal-native EndpointDataService shape) to
// the legacy APIResource<IOrganization> envelope expected by V2-era consumers
// (CloudFoundryEndpointService.orgs$ field and the add-/edit-organization
// name-uniqueness checkers).
//
// Only the fields actually read across the consumer set are populated:
//   metadata.guid                          — entity-store key lookups
//   metadata.created_at, metadata.updated_at — list sort + display
//   entity.name                            — name uniqueness, list display
//   entity.guid + entity.cfGuid            — favorite + nav links
//   entity.status                          — list status column
//   entity.quota_definition_guid           — quota lookup
//
// Mirrors stAppToAPIResource — same bridge pattern, same intent (keep the
// v2 wire-shape contract alive at consumer boundaries without round-tripping
// through the ngrx pagination cache).
export function stOrgToAPIResource(org: StOrg): APIResource<IOrganization> {
  return {
    metadata: {
      guid: org.guid,
      url: '',
      created_at: org.createdAt,
      updated_at: org.updatedAt,
    },
    entity: {
      guid: org.guid,
      cfGuid: org.cnsiGuid,
      name: org.name,
      status: org.status,
      quota_definition_guid: org.quotaGuid || undefined,
    } as IOrganization,
  };
}
