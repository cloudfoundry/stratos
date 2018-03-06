import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, switchMap } from 'rxjs/operators';

import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { organisationSchemaKey, OrganisationWithSpaceSchema } from '../../../store/actions/action-types';
import { GetOrganisation } from '../../../store/actions/organisation.actions';
import { AppState } from '../../../store/app-state';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { CfApplication } from '../../../store/types/application.types';
import {
  CfOrg,
  CfPrivateDomain,
  CfQuotaDefinition,
  CfServiceInstance,
  CfSpace,
} from '../../../store/types/org-and-space.types';
import { getOrgRolesString } from '../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';

@Injectable()
export class CloudFoundryOrganisationService {

  userOrgRole$: Observable<string>;
  quotaDefinition$: Observable<CfQuotaDefinition>;
  totalMem$: Observable<number>;
  privateDomains$: Observable<APIResource<CfPrivateDomain>[]>;
  routes$: Observable<APIResource<Route>[]>;
  serivceInstances$: Observable<APIResource<CfServiceInstance>[]>;
  spaces$: Observable<APIResource<CfSpace>[]>;
  appInstances$: Observable<number>;
  apps$: Observable<APIResource<CfApplication>[]>;
  org$: Observable<EntityInfo<APIResource<CfOrg>>>;
  organisationEntityService: EntityService<APIResource<CfOrg>>;
  constructor(
    public cfGuid: string,
    public orgGuid: string,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cfUserService: CfUserService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private cfEndpointService: CloudFoundryEndpointService

  ) {

    this.organisationEntityService = this.entityServiceFactory.create(
      organisationSchemaKey,
      OrganisationWithSpaceSchema,
      orgGuid,
      new GetOrganisation(orgGuid, cfGuid, 2)
    );

    this.initialiseObservables();
  }

  private initialiseObservables() {
    this.org$ = this.organisationEntityService.entityObs$.pipe(
      filter(o => !!o && !!o.entity)
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
    this.serivceInstances$ = this.spaces$.pipe(this.getFlattenedList('service_instances'));
    this.routes$ = this.spaces$.pipe(this.getFlattenedList('routes'));
  }

  private initialiseAppObservables() {
    this.apps$ = this.spaces$.pipe(this.getFlattenedList('apps'));
    this.appInstances$ = this.apps$.pipe(map(a => a.map(app => app.entity.instances)
      .reduce((x, sum) => x + sum, 0)));
    this.totalMem$ = this.apps$.pipe(map(a => this.cfEndpointService.getMetricFromApps(a, 'memory')));
  }

  private initialiseOrgObservables() {
    this.spaces$ = this.org$.pipe(map(o => o.entity.entity.spaces), filter(o => !!o));
    this.privateDomains$ = this.org$.pipe(map(o => o.entity.entity.private_domains));
    this.quotaDefinition$ = this.org$.pipe(map(o => o.entity.entity.quota_definition && o.entity.entity.quota_definition.entity));
  }

  private getFlattenedList(property: string): (source: Observable<APIResource<CfSpace>[]>) => Observable<any> {
    return map(entities => {
      const allInstances = entities.map(s => s.entity[property]);
      return [].concat.apply([], allInstances);
    });
  }
}
