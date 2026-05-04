import { Injectable, inject } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { endpointEntityType } from '@stratosui/store';
import { APIResource, NormalizedResponse } from '../../../../store/src/types/api.types';
import { WrapperRequestActionSuccess } from '../../../../store/src/types/request.types';
import { IOrganization, ISpace } from '../../cf-api.types';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { getCFEntityKey } from '../../cf-entity-helpers';
import {
  domainEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  spaceEntityType,
} from '../../cf-entity-types';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../entity-relations/entity-relations.types';
import { cfEntityId } from '../../cf-entity-ref';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { StEndpointData, StOrg, StSpace } from './stratos-types';

const SPACES_BULK_PAGINATION_PREFIX = 'spaces-bulk';

const ORG_ENTITY_KEY = getCFEntityKey(organizationEntityType);
const SPACE_ENTITY_KEY = getCFEntityKey(spaceEntityType);

const ORG_RELATIONS = [
  createEntityRelationKey(organizationEntityType, spaceEntityType),
  createEntityRelationKey(organizationEntityType, domainEntityType),
  createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType),
  createEntityRelationKey(organizationEntityType, privateDomainsEntityType),
];

@Injectable({ providedIn: 'root' })
export class EndpointDataShim {
  private readonly store = inject(Store);
  private readonly diagnostics = inject(StratosDiagnostics);

  write(cnsiGuid: string, data: StEndpointData): void {
    // No empty-array guard: "really empty" (e.g. CF with zero orgs, or all rows
    // removed on refresh) is a legitimate dispatch that must clear stale
    // pagination state. The service only calls this from loadDetails().finalize,
    // so arrays reflect the real state of the full-list fetch at that moment.
    //
    // Apps are intentionally NOT dispatched here. The app wall uses a single
    // shared pagination key ('applicationWall') that aggregates across all
    // connected CF endpoints. Per-endpoint shim dispatch would overwrite the
    // shared slot last-write-wins (totalResults + page IDs) even though FWT-934
    // composite keys protect the entity dictionary. App-wall's existing
    // multi-endpoint fetch path handles aggregation correctly — leave it alone.
    // The orgs + spaces shim dispatches use per-cnsi pagination keys, so they
    // don't share the overwrite hazard.
    this.dispatchOrgs(cnsiGuid, data.orgs);
    this.dispatchSpaces(cnsiGuid, data.spaces);
  }

  private dispatchOrgs(cnsiGuid: string, orgs: StOrg[]): void {
    const paginationKey = createEntityRelationPaginationKey(endpointEntityType, cnsiGuid);
    const action = cfEntityCatalog.org.actions.getMultiple(cnsiGuid, paginationKey, {
      includeRelations: ORG_RELATIONS,
      populateMissing: false,
    });
    const entities: Record<string, APIResource<IOrganization>> = {};
    const result: string[] = [];
    for (const org of orgs) {
      const id = cfEntityId({ cnsiGuid, entityGuid: org.guid });
      const resource = this.toOrgResource(org, cnsiGuid);
      entities[id] = resource;
      result.push(id);
      this.emitSize('organization', cnsiGuid, resource);
    }
    this.detectCollisions('organization', ORG_ENTITY_KEY, cnsiGuid, result);
    const response: NormalizedResponse = {
      entities: { [ORG_ENTITY_KEY]: entities },
      result,
    };
    this.store.dispatch(new WrapperRequestActionSuccess(response, action, 'fetch', orgs.length, 1));
  }

  private dispatchSpaces(cnsiGuid: string, spaces: StSpace[]): void {
    const paginationKey = `${SPACES_BULK_PAGINATION_PREFIX}-${cnsiGuid}`;
    const action = cfEntityCatalog.space.actions.getMultiple(cnsiGuid, paginationKey, {
      includeRelations: [],
      populateMissing: false,
    });
    const entities: Record<string, APIResource<ISpace>> = {};
    const result: string[] = [];
    for (const space of spaces) {
      const id = cfEntityId({ cnsiGuid, entityGuid: space.guid });
      const resource = this.toSpaceResource(space, cnsiGuid);
      entities[id] = resource;
      result.push(id);
      this.emitSize('space', cnsiGuid, resource);
    }
    this.detectCollisions('space', SPACE_ENTITY_KEY, cnsiGuid, result);
    const response: NormalizedResponse = {
      entities: { [SPACE_ENTITY_KEY]: entities },
      result,
    };
    this.store.dispatch(new WrapperRequestActionSuccess(response, action, 'fetch', spaces.length, 1));
  }

  private emitSize(entityType: string, cnsiGuid: string, resource: APIResource<unknown>): void {
    const bytes = JSON.stringify(resource).length;
    this.diagnostics.emitSample('entity-size-sample', { entityType, cnsiGuid }, bytes);
  }

  // Counts entity-key-collision-avoided events: for each composite ID we're
  // about to dispatch, check whether the current store already holds another
  // composite with the same bare-guid suffix. Each such pair is a collision
  // that would have silently overwritten data under the pre-FWT-934 bare-guid
  // key scheme. The counter is the effectiveness metric for the namespacing
  // fix; rate > 0 proves duplicate-URL scenarios are happening in practice.
  private detectCollisions(entityType: string, entityKey: string, cnsiGuid: string, newIds: string[]): void {
    let currentDict: Record<string, unknown> = {};
    this.store
      .pipe(
        select((state: { request?: Record<string, Record<string, unknown>> }) => state?.request?.[entityKey] ?? {}),
        take(1),
      )
      .subscribe(dict => {
        currentDict = dict;
      });
    for (const newId of newIds) {
      const colonIdx = newId.indexOf(':');
      if (colonIdx < 0) continue;
      const bare = newId.slice(colonIdx + 1);
      const suffix = `:${bare}`;
      for (const existingId of Object.keys(currentDict)) {
        if (existingId !== newId && existingId.endsWith(suffix)) {
          this.diagnostics.emitCounter('entity-key-collision-avoided', { entityType, cnsiGuid });
          break;
        }
      }
    }
  }

  private toOrgResource(org: StOrg, cnsiGuid: string): APIResource<IOrganization> {
    return {
      metadata: {
        guid: org.guid,
        created_at: org.createdAt || '',
        updated_at: org.updatedAt || '',
        url: `/v2/organizations/${org.guid}`,
      },
      entity: {
        name: org.name,
        status: org.status,
        guid: org.guid,
        cfGuid: cnsiGuid,
      },
    };
  }

  private toSpaceResource(space: StSpace, cnsiGuid: string): APIResource<ISpace> {
    return {
      metadata: {
        guid: space.guid,
        created_at: space.createdAt || '',
        updated_at: space.updatedAt || '',
        url: `/v2/spaces/${space.guid}`,
      },
      entity: {
        name: space.name,
        organization_guid: space.orgGuid,
        allow_ssh: false,
        organization_url: `/v2/organizations/${space.orgGuid}`,
        developers_url: '',
        managers_url: '',
        auditors_url: '',
        apps_url: '',
        routes_url: '',
        domains_url: '',
        service_instances_url: '',
        app_events_url: '',
        security_groups_url: '',
        staging_security_groups_url: '',
        cfGuid: cnsiGuid,
        guid: space.guid,
      },
    };
  }
}
