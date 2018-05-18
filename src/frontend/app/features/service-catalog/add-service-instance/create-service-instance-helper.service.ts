import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, publishReplay, refCount, share, switchMap, tap } from 'rxjs/operators';

import { IService, IServiceBroker, IServicePlan, IServicePlanVisibility, IServiceInstance } from '../../../core/cf-api-svc.types';
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
  serviceInstancesSchemaKey,
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
import { GetServiceInstances } from '../../../store/actions/service-instances.actions';


export enum Mode {
  // Skips CF selection and services screen
  MARKETPLACE = 'markedPlaceMode',
  // Sips CF selection and preselects APP binding
  APPSERVICE = 'AppServiceMode',
  DEFAULT = 'default'
}
@Injectable()
export class CreateServiceInstanceHelperService {
  mode: Mode;
  serviceEntityService: EntityService<APIResource<IService>>;

  private initialised$ = new BehaviorSubject(false);
  cfGuid$ = new BehaviorSubject(null);
  serviceGuid$ = new BehaviorSubject(null);
  service$ = new BehaviorSubject(null);
  serviceBroker$ = new BehaviorSubject(null);
  servicePlanVisibilities$ = new BehaviorSubject(null);
  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) { }


  initBaseObservables = (serviceId: string, cfGuid: string) => {
    this.serviceEntityService = this.entityServiceFactory.create(
      serviceSchemaKey,
      entityFactory(serviceSchemaKey),
      serviceId,
      new GetService(serviceId, cfGuid),
      true
    );
    this.serviceEntityService.waitForEntity$.pipe(
      filter(o => !!o && !!o.entity),
      map(o => o.entity),
      publishReplay(1),
      refCount(),
      first(),
      tap(svc => {
        this.service$.next(svc);
        const brokerId = svc.entity.service_broker_guid;
        const serviceEntityService = this.entityServiceFactory.create(
          serviceBrokerSchemaKey,
          entityFactory(serviceBrokerSchemaKey),
          svc.entity.service_broker_guid,
          new GetServiceBroker(brokerId, svc.entity.cfGuid),
          true
        );
        serviceEntityService.waitForEntity$.pipe(
          filter(o => !!o && !!o.entity),
          map(o => o.entity),
          publishReplay(1),
          refCount(),
          tap(
            p => this.serviceBroker$.next(p)
          ),
        ).subscribe();
      })
    ).subscribe();

    const paginationKey = createEntityRelationPaginationKey(servicePlanVisibilitySchemaKey, cfGuid);
    return getPaginationObservables<APIResource<IServicePlanVisibility>>(
      {
        store: this.store,
        action: new GetServicePlanVisibilities(cfGuid, paginationKey),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(servicePlanVisibilitySchemaKey)
        )
      },
      true
    ).entities$.pipe(
      first(),
      tap(o => this.servicePlanVisibilities$.next(o))
    ).subscribe();
  }

  isMarketplace = () => this.mode === Mode.MARKETPLACE;
  isAppServices = () => this.mode === Mode.APPSERVICE;

  initService = (cfGuid: string, serviceGuid: string, mode: Mode = Mode.DEFAULT) => {

    this.cfGuid$.next(cfGuid);
    this.serviceGuid$.next(serviceGuid);
    this.mode = mode;
    this.initialised$.next(true);

    this.initBaseObservables(serviceGuid, cfGuid);
  }

  isInitialised = (b: BehaviorSubject<any> = this.initialised$) => b.pipe(
    filter(p => !!p),
    combineLatest(this.cfGuid$, this.serviceGuid$),
    map(([p, cfGuid, serviceGuid]) => {
      return {
        cfGuid: cfGuid,
        serviceGuid: serviceGuid
      };
    })
  )

  getVisibleServicePlans = () => {
    return this.getServicePlans().pipe(
      filter(p => !!p && p.length > 0),
      map(o => o.filter(s => s.entity.bindable)),
      combineLatest(this.getServicePlanVisibilities(), this.getServiceBroker(), this.getService()),
      map(([svcPlans, svcPlanVis, svcBrokers, svc]) => fetchVisiblePlans(svcPlans, svcPlanVis, svcBrokers, svc)),
    );
  }

  getServiceBroker(): Observable<APIResource<IServiceBroker>> {

    return this.serviceBroker$.pipe(
      filter(p => !!p)
    );
  }
  getService = (): Observable<APIResource<IService>> => this.service$.pipe(filter(p => !!p));
  getServicePlanVisibilities = (): Observable<APIResource<IServicePlanVisibility>[]> =>
    this.servicePlanVisibilities$.pipe(filter(p => !!p))

  getServicePlans(): Observable<APIResource<IServicePlan>[]> {
    return this.getService().pipe(
      filter(p => !!p),
      map(o => o.entity.service_plans));
  }

  getServiceName = () => {
    return this.getService()
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
    return this.getService().pipe(
      filter(p => !!p),
      switchMap(o => this.getServiceBroker()),
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
        combineLatest(this.cfGuid$),
        switchMap(([servicePlanAccessbility, cfGuid]) => {
          if (servicePlanAccessbility.isPublic) {
            const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizationsLimitedSchema(cfGuid);
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
            const action = new GetSpace(servicePlanAccessbility.spaceGuid, cfGuid,
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

  getServiceInstancesForService = (servicePlanGuid: string = null) => {
    return this.isInitialised().pipe(
      switchMap(p => {
        const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, p.cfGuid);
        const getAllServiceInstances = new GetServiceInstances(p.cfGuid, paginationKey);
        return getPaginationObservables<APIResource<IServiceInstance>>({
          store: this.store,
          action: getAllServiceInstances,
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(serviceInstancesSchemaKey)
          )
        }, true)
          .entities$.pipe(
            share(),
            first(),
            map(serviceInstances => serviceInstances.filter(s => (s.entity.service_guid === p.serviceGuid))),
            // Filter out services that belong to other service plans if required
            map(serviceInstances => servicePlanGuid ?
              serviceInstances.filter(s => (s.entity.service_plan_guid === servicePlanGuid)) : serviceInstances)
          );

      })
    );
  }

}
