import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { endpointEntityType } from '@stratosui/store';
import { APIResource, NormalizedResponse } from '../../../../store/src/types/api.types';
import { WrapperRequestActionSuccess } from '../../../../store/src/types/request.types';
import { IApp, IOrganization, ISpace } from '../../cf-api.types';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { getCFEntityKey } from '../../cf-entity-helpers';
import {
  applicationEntityType,
  domainEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../cf-entity-types';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../entity-relations/entity-relations.types';
import { cfEntityId } from '../../cf-entity-ref';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { StApp, StEndpointData, StOrg, StSpace } from './stratos-types';

const APP_WALL_PAGINATION_KEY = 'applicationWall';
const SPACES_BULK_PAGINATION_PREFIX = 'spaces-bulk';

const ORG_ENTITY_KEY = getCFEntityKey(organizationEntityType);
const APP_ENTITY_KEY = getCFEntityKey(applicationEntityType);
const SPACE_ENTITY_KEY = getCFEntityKey(spaceEntityType);

const ORG_RELATIONS = [
  createEntityRelationKey(organizationEntityType, spaceEntityType),
  createEntityRelationKey(organizationEntityType, domainEntityType),
  createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType),
  createEntityRelationKey(organizationEntityType, privateDomainsEntityType),
];

const APP_RELATIONS = [
  createEntityRelationKey(applicationEntityType, spaceEntityType),
  createEntityRelationKey(spaceEntityType, organizationEntityType),
  createEntityRelationKey(applicationEntityType, routeEntityType),
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
    // FWT-934: entity dictionary keys are now cnsiGuid:guid composite, so
    // multi-endpoint dispatches no longer collide. Apps are dispatched through
    // the shim as well — the shared 'applicationWall' pagination key still
    // aggregates across endpoints, but entities live under distinct composite
    // keys so the cross-endpoint collision bug `24014431d7` worked around is
    // gone.
    this.dispatchOrgs(cnsiGuid, data.orgs);
    this.dispatchApps(cnsiGuid, data.apps);
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
    const response: NormalizedResponse = {
      entities: { [ORG_ENTITY_KEY]: entities },
      result,
    };
    this.store.dispatch(new WrapperRequestActionSuccess(response, action, 'fetch', orgs.length, 1));
  }

  private dispatchApps(cnsiGuid: string, apps: StApp[]): void {
    const action = cfEntityCatalog.application.actions.getMultiple(cnsiGuid, APP_WALL_PAGINATION_KEY, {
      includeRelations: APP_RELATIONS,
      populateMissing: false,
    });
    const entities: Record<string, APIResource<IApp>> = {};
    const result: string[] = [];
    for (const app of apps) {
      const id = cfEntityId({ cnsiGuid, entityGuid: app.guid });
      const resource = this.toAppResource(app, cnsiGuid);
      entities[id] = resource;
      result.push(id);
      this.emitSize('application', cnsiGuid, resource);
    }
    const response: NormalizedResponse = {
      entities: { [APP_ENTITY_KEY]: entities },
      result,
    };
    this.store.dispatch(new WrapperRequestActionSuccess(response, action, 'fetch', apps.length, 1));
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

  private toAppResource(app: StApp, cnsiGuid: string): APIResource<IApp> {
    return {
      metadata: {
        guid: app.guid,
        created_at: app.createdAt || '',
        updated_at: app.updatedAt || '',
        url: `/v2/apps/${app.guid}`,
      },
      entity: {
        name: app.name,
        state: app.state,
        space_guid: app.spaceGuid,
        instances: app.instances,
        guid: app.guid,
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
