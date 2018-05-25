import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, publishReplay, refCount, share, switchMap, tap, take } from 'rxjs/operators';

import { IService, IServiceBroker, IServicePlan, IServicePlanVisibility } from '../../../core/cf-api-svc.types';
import { IOrganization, ISpace } from '../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { pathGet } from '../../../core/utils.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { GetServiceBroker } from '../../../store/actions/service-broker.actions';
import { GetServicePlanVisibilities } from '../../../store/actions/service-plan-visibility.actions';
import { GetService } from '../../../store/actions/service.actions';
import { GetSpace } from '../../../store/actions/space.actions';
import { AppState } from '../../../store/app-state';
import {
  entityFactory,
  organizationSchemaKey,
  serviceBrokerSchemaKey,
  servicePlanVisibilitySchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../../store/helpers/entity-factory';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import {
  selectCreateServiceInstance,
  selectCreateServiceInstanceServicePlan,
} from '../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../store/types/api.types';
import { CreateServiceInstanceState } from '../../../store/types/create-service-instance.types';
import { CloudFoundryEndpointService } from '../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { fetchVisiblePlans, getSvcAvailability } from '../services-helper';
import { ServicePlanAccessibility } from '../services.service';
import { EntityService } from '../../../core/entity-service';

export enum CreateServiceInstanceMode {
  MARKETPLACE_MODE = 'marketPlaceMode',
  APP_SERVICES_MODE = 'appServicesMode',
  SERVICES_WALL_MODE = 'servicesWallMode'
}
@Injectable()
export class CreateServiceInstanceHelperService {
  servicePlanVisibilities$: Observable<APIResource<IServicePlanVisibility>[]>;
  serviceBroker$: Observable<APIResource<IServiceBroker>>;
  service$: Observable<APIResource<IService>>;
  // Is instance being created from the Marketplace
  public marketPlaceMode = false;

  constructor(
    private store: Store<AppState>,
    public serviceGuid: string,
    public cfGuid: string,
    public mode: CreateServiceInstanceMode,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {

    this.initBaseObservables();
  }

  initBaseObservables = () => {

    const serviceEntityService = this.entityServiceFactory.create(
      serviceSchemaKey,
      entityFactory(serviceSchemaKey),
      this.serviceGuid,
      new GetService(this.serviceGuid, this.cfGuid),
      true
    );
    this.service$ = serviceEntityService.waitForEntity$.pipe(
      filter(o => !!o && !!o.entity),
      map(o => o.entity),
      publishReplay(1),
      refCount()
    );

    this.serviceBroker$ = this.service$.pipe(
      map(o => o.entity.service_broker_guid),
      switchMap(guid => {
        const brokerEntityService = this.entityServiceFactory.create(
          serviceBrokerSchemaKey,
          entityFactory(serviceBrokerSchemaKey),
          guid,
          new GetServiceBroker(guid, this.cfGuid),
          true
        );
        return brokerEntityService.waitForEntity$.pipe(
          filter(o => !!o && !!o.entity),
          map(o => o.entity),
        );
      }),
      publishReplay(1),
      refCount()
    );

    const paginationKey = createEntityRelationPaginationKey(servicePlanVisibilitySchemaKey, this.cfGuid);
    this.servicePlanVisibilities$ = getPaginationObservables<APIResource<IServicePlanVisibility>>(
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

  isMarketplace = () => this.mode === CreateServiceInstanceMode.MARKETPLACE_MODE;

  getVisibleServicePlans = () => {
    return this.getServicePlans().pipe(
      filter(p => !!p && p.length > 0),
      map(o => o.filter(s => s.entity.bindable)),
      combineLatest(this.getServicePlanVisibilities(), this.serviceBroker$, this.service$),
      map(([svcPlans, svcPlanVis, svcBrokers, svc]) => fetchVisiblePlans(svcPlans, svcPlanVis, svcBrokers, svc)),
    );
  }

  getVisibleServicePlansForSpaceAndOrg = (orgGuid: string, spaceGuid: string): Observable<APIResource<IServicePlan>[]> => {
    return this.getServicePlans().pipe(
      filter(p => !!p && p.length > 0),
      map(o => o.filter(s => s.entity.bindable)),
      combineLatest(this.getServicePlanVisibilitiesForOrg(orgGuid), this.serviceBroker$, this.service$),
      map(([svcPlans, svcPlanVis, svcBrokers, svc]) => fetchVisiblePlans(svcPlans, svcPlanVis, svcBrokers, svc, spaceGuid)),
    );
  }

  getServicePlanVisibilities = (): Observable<APIResource<IServicePlanVisibility>[]> =>
    this.servicePlanVisibilities$.pipe(filter(p => !!p))

  getServicePlanVisibilitiesForOrg = (orgGuid: string): Observable<APIResource<IServicePlanVisibility>[]> =>
    this.servicePlanVisibilities$.pipe(
      filter(p => !!p),
      map(entities => entities.filter(entity => entity.entity.organization_guid === orgGuid))
    )

  getServicePlans(): Observable<APIResource<IServicePlan>[]> {
    return this.service$.pipe(
      filter(p => !!p),
      map(o => o.entity.service_plans));
  }


  getServiceName = () => {
    return this.service$
      .pipe(
        filter(p => !!p),
        map(service => {
          const extraInfo = JSON.parse(service.entity.extra);
          if (extraInfo && extraInfo.displayName) {
            return extraInfo.displayName;
          } else {
            return service.entity.label;
          }
        }));
  }

  getServicePlanAccessibility = (servicePlan: APIResource<IServicePlan>): Observable<ServicePlanAccessibility> => {
    if (servicePlan.entity.public) {
      return Observable.of({
        isPublic: true,
        guid: servicePlan.metadata.guid
      });
    }
    return this.serviceBroker$.pipe(
      combineLatest(this.getServicePlanVisibilities()),
      filter(([p, q]) => !!p && !!q),
      map(([serviceBroker, allServicePlanVisibilities]) => getSvcAvailability(servicePlan, serviceBroker, allServicePlanVisibilities))
    );
  }

  getSelectedServicePlan = (): Observable<APIResource<IServicePlan>> => {
    return Observable.combineLatest(this.store.select(selectCreateServiceInstanceServicePlan), this.getServicePlans())
      .pipe(
        filter(([p, q]) => !!p && !!q),
        map(([servicePlanGuid, servicePlans]) => servicePlans.filter(o => o.metadata.guid === servicePlanGuid)),
        map(p => p[0]), filter(p => !!p)
      );
  }

  getSelectedServicePlanAccessibility = (): Observable<ServicePlanAccessibility> => {
    return this.getSelectedServicePlan().pipe(
      switchMap(plan => this.getServicePlanAccessibility(plan))
    );
  }

  getOrgsForSelectedServicePlan = (): Observable<APIResource<IOrganization>[]> => {
    return this.getSelectedServicePlan()
      .pipe(
        switchMap(servicePlan => this.getServicePlanAccessibility(servicePlan)),
        switchMap(servicePlanAccessbility => {
          if (servicePlanAccessbility.isPublic) {
            const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizationsLimitedSchema(this.cfGuid);
            return getPaginationObservables<APIResource<IOrganization>>({
              store: this.store,
              action: getAllOrgsAction,
              paginationMonitor: this.paginationMonitorFactory.create(
                getAllOrgsAction.paginationKey,
                entityFactory(organizationSchemaKey)
              )
            }, true)
              .entities$.pipe(share(), first());
          } else if (servicePlanAccessbility.spaceScoped) {
            // Service plan is not public, but is space-scoped
            const action = new GetSpace(servicePlanAccessbility.spaceGuid, this.cfGuid,
              [
                createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
              ]
            );
            action.entity = [entityFactory(spaceWithOrgKey)];
            return this.entityServiceFactory.create<APIResource<ISpace>>(
              spaceSchemaKey,
              entityFactory(spaceWithOrgKey),
              servicePlanAccessbility.spaceGuid,
              action,
              true
            ).waitForEntity$
              .pipe(
                // Block until the org is either fetched or associated with existing entity
                filter(p => !!pathGet('entity.entity.organization.entity', p)),
                map((p) => {
                  const orgEntity = { ...p.entity.entity.organization.entity, spaces: [p.entity] };
                  return [{ ...p.entity.entity.organization, entity: orgEntity }];
                }),
            );
          } else if (servicePlanAccessbility.hasVisibilities) {
            // Service plan is not public, fetch visibilities
            return this.getServicePlanVisibilitiesForPlan(servicePlanAccessbility.guid)
              .pipe(
                map(s => s.map(o => o.entity.organization)),
            );
          }
        }
        ),
        share(), first()
      );
  }

  getServicePlanVisibilitiesForPlan = (servicePlanGuid: string): Observable<APIResource<IServicePlanVisibility>[]> => {
    return this.getServicePlanVisibilities().pipe(
      filter(p => !!p),
      map(vis => vis.filter(s => s.entity.service_plan_guid === servicePlanGuid)),
      first()
    );
  }

}
