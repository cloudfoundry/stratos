import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, publishReplay, refCount, share, switchMap } from 'rxjs/operators';

import { IService, IServiceBroker, IServiceExtra, IServicePlan, IServicePlanVisibility } from '../../core/cf-api-svc.types';
import { IOrganization, ISpace } from '../../core/cf-api.types';
import { EntityService } from '../../core/entity-service';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { pathGet } from '../../core/utils.service';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { GetServiceBrokers } from '../../store/actions/service-broker.actions';
import { GetServicePlanVisibilities } from '../../store/actions/service-plan-visibility.actions';
import { GetService } from '../../store/actions/service.actions';
import { GetSpace } from '../../store/actions/space.actions';
import { AppState } from '../../store/app-state';
import {
  entityFactory,
  organizationSchemaKey,
  serviceBrokerSchemaKey,
  servicePlanVisibilitySchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../store/helpers/entity-factory';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import {
  selectCreateServiceInstanceCfGuid,
  selectCreateServiceInstanceServicePlan,
} from '../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../store/types/api.types';
import { getIdFromRoute } from '../cloud-foundry/cf.helpers';
import { CloudFoundryEndpointService } from '../cloud-foundry/services/cloud-foundry-endpoint.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { getSvcAvailability } from './services-helper';

export interface ServicePlanAccessibility {
  spaceScoped?: boolean;
  hasVisibilities?: boolean;
  isPublic: boolean;
  guid?: string;
  spaceGuid?: string;
}

@Injectable()
export class ServicesService {
  serviceGuid: any;
  cfGuid: any;
  serviceBrokers$: Observable<APIResource<IServiceBroker>[]>;
  servicePlanVisibilities$: Observable<APIResource<IServicePlanVisibility>[]>;
  servicePlans$: Observable<APIResource<IServicePlan>[]>;
  serviceExtraInfo$: Observable<IServiceExtra>;
  service$: Observable<APIResource<IService>>;
  serviceEntityService: EntityService<APIResource<IService>>;
  initialised$ = new BehaviorSubject(false);


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
    this.serviceExtraInfo$ = this.service$.pipe(
      map(o => JSON.parse(o.entity.extra))
    );

    this.servicePlans$ = this.service$.pipe(
      map(o => o.entity.service_plans)
    );
    this.servicePlanVisibilities$ = this.getServicePlanVisibilities();
    this.serviceBrokers$ = this.getServiceBrokers();
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

  getServiceBrokers = () => {
    const paginationKey = createEntityRelationPaginationKey(serviceBrokerSchemaKey, this.cfGuid);
    return getPaginationObservables<APIResource<IServiceBroker>>(
      {
        store: this.store,
        action: new GetServiceBrokers(this.cfGuid, paginationKey),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(serviceBrokerSchemaKey)
        )
      },
      true
    ).entities$;
  }

  getServiceBrokerById = (guid: string): Observable<APIResource<IServiceBroker>> => this.serviceBrokers$
    .pipe(
      filter(p => !!p),
      map(brokers => brokers.filter(b => b.metadata.guid === guid)),
      filter(s => s && s.length === 1),
      map(s => s[0]),
      first()
    )

  getVisibleServicePlans = () => {
    return this.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
      map(o => o.filter(s => s.entity.bindable)),
      combineLatest(this.servicePlanVisibilities$, this.serviceBrokers$, this.service$),
      map(([svcPlans, svcPlanVis, svcBrokers, svc]) => this.fetchVisiblePlans(svcPlans, svcPlanVis, svcBrokers, svc)),

    );
  }

  fetchVisiblePlans =
    (svcPlans: APIResource<IServicePlan>[],
      svcPlanVis: APIResource<IServicePlanVisibility>[],
      svcBrokers: APIResource<IServiceBroker>[],
      svc: APIResource<IService>): APIResource<IServicePlan>[] => {
      const visiblePlans: APIResource<IServicePlan>[] = [];
      svcPlans.forEach(p => {
        if (p.entity.public) {
          visiblePlans.push(p);
        } else if (svcPlanVis.filter(svcVis => svcVis.entity.service_plan_guid === p.metadata.guid).length > 0) {
          // plan is visibilities
          visiblePlans.push(p);
        } else if (svcBrokers.filter(s => s.metadata.guid === svc.entity.service_broker_guid)[0].entity.space_guid) {
          // Plan is space-scoped
          visiblePlans.push(p);
        }
      });
      return visiblePlans;
    }

  getServicePlanAccessibility = (servicePlan: APIResource<IServicePlan>): Observable<ServicePlanAccessibility> => {
    if (servicePlan.entity.public) {
      return Observable.of({
        isPublic: true,
        guid: servicePlan.metadata.guid
      });
    }
    return this.service$.pipe(
      switchMap(o => this.getServiceBrokerById(o.entity.service_broker_guid)),
      combineLatest(this.servicePlanVisibilities$),
      filter(([p, q]) => !!p && !!q),
      map(([serviceBroker, allServicePlanVisibilities]) => getSvcAvailability(servicePlan, serviceBroker, allServicePlanVisibilities))
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
