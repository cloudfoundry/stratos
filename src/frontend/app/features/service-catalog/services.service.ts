import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store/store';

import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { AppState } from '../../store/app-state';
import { entityFactory, serviceSchemaKey, servicePlanVisibilitySchemaKey, organizationSchemaKey } from '../../store/helpers/entity-factory';
import { ActiveRouteCfOrgSpace } from '../cloud-foundry/cf-page.types';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { GetService } from '../../store/actions/service.actions';
import { EntityService } from '../../core/entity-service';
import { APIResource, EntityInfo } from '../../store/types/api.types';
import { IService, IServiceExtra, IServicePlan, IServicePlanVisibility } from '../../core/cf-api-svc.types';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../cloud-foundry/cf.helpers';
import { filter, map, tap, publish, refCount, publishReplay, first, combineLatest, share, switchMap } from 'rxjs/operators';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { createEntityRelationPaginationKey } from '../../store/helpers/entity-relations.types';
import { GetServicePlanVisibilities } from '../../store/actions/service-plan-visibility.actions';
import { selectCreateServiceInstanceServicePlan } from '../../store/selectors/create-service-instance.selectors';
import { CloudFoundryEndpointService } from '../cloud-foundry/services/cloud-foundry-endpoint.service';
import { IOrganization } from '../../core/cf-api.types';

@Injectable()
export class ServicesService {
  servicePlanVisibilities$: Observable<APIResource<IServicePlanVisibility>[]>;
  servicePlans$: Observable<APIResource<IServicePlan>[]>;
  serviceExtraInfo$: Observable<IServiceExtra>;
  serviceGuid: string;
  cfGuid: string;
  service$: Observable<APIResource<IService>>;
  serviceEntityService: EntityService<APIResource<IService>>;


  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    public activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory

  ) {

    this.cfGuid = getIdFromRoute(activatedRoute, 'cfId');
    this.serviceGuid = getIdFromRoute(activatedRoute, 'serviceId');
    this.serviceEntityService = this.entityServiceFactory.create(
      serviceSchemaKey,
      entityFactory(serviceSchemaKey),
      this.serviceGuid,
      new GetService(this.serviceGuid, this.cfGuid),
      true
    );
    this.service$ = this.serviceEntityService.waitForEntity$.pipe(
      filter(o => !!o && !!o.entity),
      map(o => o.entity),
      publishReplay(1),
      refCount()
    );

    this.servicePlanVisibilities$ = this.getServicePlanVisibilities();

    this.serviceExtraInfo$ = this.service$.pipe(
      map(o => JSON.parse(o.entity.extra))
    );

    this.servicePlans$ = this.service$.pipe(
      map(o => o.entity.service_plans)
    );
  }

  getServicePlanVisibilities = () => {
    const paginationKey = createEntityRelationPaginationKey(servicePlanVisibilitySchemaKey, this.cfGuid);
    return getPaginationObservables<APIResource<IServicePlanVisibility>>(
      {
        store: this.store,
        action: new GetServicePlanVisibilities(this.cfGuid, paginationKey),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(servicePlanVisibilitySchemaKey)
        )
      },
      true
    ).entities$;
  }
  getServicePlanVisibilitiesForPlan = (servicePlanGuid: string): Observable<APIResource<IServicePlanVisibility>[]> => {
    return this.servicePlanVisibilities$.pipe(
      filter(p => !!p),
      map(vis => vis.filter(s => s.entity.service_plan_guid === servicePlanGuid)),
      first()
    );
  }

  getVisiblePlans = () => {
    return this.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
      map(o => o.filter(s => s.entity.bindable)),
      combineLatest(this.servicePlanVisibilities$),
      map(([svcPlans, svcPlanVis]) => this.fetchVisiblePlans(svcPlans, svcPlanVis)),
    );
  }

  fetchVisiblePlans =
  (svcPlans: APIResource<IServicePlan>[], svcPlanVis: APIResource<IServicePlanVisibility>[]): APIResource<IServicePlan>[] => {
    const visiblePlans: APIResource<IServicePlan>[] = [];
    svcPlans.forEach(p => {
      if (p.entity.public) {
        visiblePlans.push(p);
      } else if (svcPlanVis.filter(svcVis => svcVis.entity.service_plan_guid === p.metadata.guid).length > 0) {
        visiblePlans.push(p);
      }
    });
    return visiblePlans;
  }

  getServicePlanByGuid = (servicePlanGuid: string) => {
    return this.servicePlans$.pipe(
      filter(p => !!p),
      map(servicePlans => servicePlans.filter(o => o.metadata.guid === servicePlanGuid)),
      map(o => o[0])
    );
  }

  getSelectedServicePlan = (): Observable<APIResource<IServicePlan>> => {
    return Observable.combineLatest(this.store.select(selectCreateServiceInstanceServicePlan), this.servicePlans$)
      .pipe(
      filter(([p, q]) => !!p && !!q),
      map(([servicePlanGuid, servicePlans]) => servicePlans.filter(o => o.metadata.guid === servicePlanGuid)),
      map(p => p[0]),
      filter(p => !!p)
      );
  }

  getOrgsForSelectedServicePlan = (): Observable<APIResource<IOrganization>[]> => {
    return this.getSelectedServicePlan()
      .pipe(
      switchMap(servicePlan => {
        if (servicePlan.entity.public) {
          const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizationsLimitedSchema(this.cfGuid);
          return getPaginationObservables<APIResource<IOrganization>>({
            store: this.store,
            action: getAllOrgsAction,
            paginationMonitor: this.paginationMonitorFactory.create(
              getAllOrgsAction.paginationKey,
              entityFactory(organizationSchemaKey)
            )
          }, true)
            .entities$.pipe(
            share(),
            first()
            );
        } else {
          // Service plan is not public, fetch visibilities
          return this.getServicePlanVisibilitiesForPlan(servicePlan.metadata.guid)
            .pipe(
            map(s => s.map(o => o.entity.organization)),
            share(),
            first()
            );
        }
      })
      );
  }

  getServiceName = () => {
    return Observable.combineLatest(this.serviceExtraInfo$, this.service$)
      .pipe(
      map(([extraInfo, service]) => {
        if (extraInfo && extraInfo.displayName) {
          return extraInfo.displayName;
        } else {
          return service.entity.label;
        }
      }));
  }
}
