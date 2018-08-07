import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { IServiceInstance } from '../../../core/cf-api-svc.types';
import { IApp, IOrganization, IPrivateDomain, IQuotaDefinition, ISpace } from '../../../core/cf-api.types';
import { getStartedAppInstanceCount } from '../../../core/cf.helpers';
import { EntityService } from '../../../core/entity-service';
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
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfUser } from '../../../store/types/user.types';
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
  orgEntityService: EntityService<APIResource<IOrganization>>;
  allOrgUsers: PaginationObservables<APIResource<CfUser>>;
  allOrgUsersAction: GetAllOrgUsers;
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
    this.allOrgUsersAction = new GetAllOrgUsers(
      activeRouteCfOrgSpace.orgGuid,
      this.usersPaginationKey,
      activeRouteCfOrgSpace.cfGuid
    );
    this.orgEntityService = this.entityServiceFactory.create(
      organizationSchemaKey,
      entityFactory(organizationSchemaKey),
      this.orgGuid,
      new GetOrganization(this.orgGuid, this.cfGuid, [
        createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
        createEntityRelationKey(organizationSchemaKey, domainSchemaKey),
        createEntityRelationKey(organizationSchemaKey, quotaDefinitionSchemaKey),
        createEntityRelationKey(organizationSchemaKey, privateDomainsSchemaKey),
        createEntityRelationKey(organizationSchemaKey, cfUserSchemaKey),
        createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
        createEntityRelationKey(spaceSchemaKey, applicationSchemaKey),
        createEntityRelationKey(spaceSchemaKey, routeSchemaKey),
      ]),
      true
    );

    this.initialiseObservables();
  }

  public deleteSpace(spaceGuid: string, orgGuid: string, endpointGuid: string) {
    this.store.dispatch(new DeleteSpace(spaceGuid, orgGuid, endpointGuid));
  }

  private initialiseObservables() {
    this.org$ = this.orgEntityService.waitForEntity$;

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

    this.allOrgUsers = getPaginationObservables({
      store: this.store,
      action: this.allOrgUsersAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        this.usersPaginationKey,
        entityFactory(cfUserSchemaKey)
      )
    });
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
