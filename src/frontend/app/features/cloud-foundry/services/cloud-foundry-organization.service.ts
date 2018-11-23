import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { IServiceInstance } from '../../../core/cf-api-svc.types';
import { IApp, IOrganization, IPrivateDomain, IQuotaDefinition, ISpace } from '../../../core/cf-api.types';
import { getStartedAppInstanceCount } from '../../../core/cf.helpers';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetAllOrgUsers, GetOrganization } from '../../../store/actions/organization.actions';
import { DeleteSpace } from '../../../store/actions/space.actions';
import { AppState } from '../../../store/app-state';
import {
  applicationSchemaKey,
  cfUserSchemaKey,
  domainSchemaKey,
  entityFactory,
  organizationSchemaKey,
  privateDomainsSchemaKey,
  quotaDefinitionSchemaKey,
  routeSchemaKey,
  serviceInstancesSchemaKey,
  spaceSchemaKey,
} from '../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfUser, OrgUserRoleNames } from '../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getOrgRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';


@Injectable()
export class CloudFoundryOrganizationService {
  orgGuid: string;
  cfGuid: string;
  userOrgRole$: Observable<string>;
  quotaDefinition$: Observable<IQuotaDefinition>;
  totalMem$: Observable<number>;
  privateDomains$: Observable<APIResource<IPrivateDomain>[]>;
  routes$: Observable<APIResource<Route>[]>;
  serviceInstances$: Observable<APIResource<IServiceInstance>[]>;
  spaces$: Observable<APIResource<ISpace>[]>;
  appInstances$: Observable<number>;
  apps$: Observable<APIResource<IApp>[]>;
  org$: Observable<EntityInfo<APIResource<IOrganization>>>;
  allOrgUsers$: Observable<APIResource<CfUser>[]>;
  usersPaginationKey: string;

  constructor(
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private cfEndpointService: CloudFoundryEndpointService

  ) {
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.usersPaginationKey = createEntityRelationPaginationKey(organizationSchemaKey, activeRouteCfOrgSpace.orgGuid);

    this.initialiseObservables();
  }

  public deleteSpace(spaceGuid: string, orgGuid: string, endpointGuid: string) {
    this.store.dispatch(new DeleteSpace(spaceGuid, orgGuid, endpointGuid));
  }

  private initialiseObservables() {
    this.org$ = this.cfUserService.isConnectedUserAdmin(this.cfGuid).pipe(
      switchMap(isAdmin => {
        const relations = [
          createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
          createEntityRelationKey(organizationSchemaKey, domainSchemaKey),
          createEntityRelationKey(organizationSchemaKey, quotaDefinitionSchemaKey),
          createEntityRelationKey(organizationSchemaKey, privateDomainsSchemaKey),
          createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
          createEntityRelationKey(spaceSchemaKey, applicationSchemaKey),
          createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
        ];
        if (!isAdmin) {
          // We're only interested in fetching org roles via the org request for non-admins. This is the only way to guarantee the roles
          // are present for all users associated with the org
          relations.push(
            createEntityRelationKey(organizationSchemaKey, OrgUserRoleNames.USER),
            createEntityRelationKey(organizationSchemaKey, OrgUserRoleNames.MANAGER),
            createEntityRelationKey(organizationSchemaKey, OrgUserRoleNames.BILLING_MANAGERS),
            createEntityRelationKey(organizationSchemaKey, OrgUserRoleNames.AUDITOR),
          );
        }
        const orgEntityService = this.entityServiceFactory.create<APIResource<IOrganization>>(
          organizationSchemaKey,
          entityFactory(organizationSchemaKey),
          this.orgGuid,
          new GetOrganization(this.orgGuid, this.cfGuid, relations),
          true
        );
        return orgEntityService.waitForEntity$;
      }),
      publishReplay(1),
      refCount()
    );

    this.initialiseOrgObservables();

    this.initialiseAppObservables();

    this.initialiseSpaceObservables();

    this.userOrgRole$ = this.cfEndpointService.currentUser$.pipe(
      switchMap(u => this.cfUserService.getUserRoleInOrg(u.guid, this.orgGuid, this.cfGuid)),
      map(u => getOrgRolesString(u))
    );

  }

  private initialiseSpaceObservables() {
    this.serviceInstances$ = this.spaces$.pipe(this.getFlattenedList('service_instances'));
    this.routes$ = this.spaces$.pipe(this.getFlattenedList('routes'));
  }

  private initialiseAppObservables() {
    this.apps$ = this.spaces$.pipe(this.getFlattenedList('apps'));
    this.appInstances$ = this.apps$.pipe(
      filter($apps => !!$apps),
      map(getStartedAppInstanceCount)
    );

    this.totalMem$ = this.apps$.pipe(map(a => this.cfEndpointService.getMetricFromApps(a, 'memory')));
  }

  private initialiseOrgObservables() {
    this.spaces$ = this.org$.pipe(map(o => o.entity.entity.spaces), filter(o => !!o));
    this.privateDomains$ = this.org$.pipe(map(o => o.entity.entity.private_domains));
    this.quotaDefinition$ = this.org$.pipe(map(o => o.entity.entity.quota_definition && o.entity.entity.quota_definition.entity));


    this.allOrgUsers$ = this.cfUserService.isConnectedUserAdmin(this.cfGuid).pipe(
      switchMap(isAdmin => {
        const action = new GetAllOrgUsers(this.orgGuid, this.usersPaginationKey, this.cfGuid, isAdmin);
        return getPaginationObservables<APIResource<CfUser>>({
          store: this.store,
          action,
          paginationMonitor: this.paginationMonitorFactory.create(
            this.usersPaginationKey,
            entityFactory(cfUserSchemaKey)
          )
        }).entities$;
      })
    );
  }

  private getFlattenedList(property: string): (source: Observable<APIResource<ISpace>[]>) => Observable<any> {
    return map(entities => {
      const allInstances = entities
        .map(s => s.entity[property])
        .filter(s => !!s);
      return [].concat.apply([], allInstances);
    });
  }
}
