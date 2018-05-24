import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, publishReplay, refCount, share, switchMap, tap } from 'rxjs/operators';

import {
  IService,
  IServiceBroker,
  IServiceExtra,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
} from '../../core/cf-api-svc.types';
import { IOrganization, ISpace } from '../../core/cf-api.types';
import { EntityService } from '../../core/entity-service';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { pathGet } from '../../core/utils.service';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { GetServiceBrokers } from '../../store/actions/service-broker.actions';
import { GetServiceInstances } from '../../store/actions/service-instances.actions';
import { GetServicePlanVisibilities } from '../../store/actions/service-plan-visibility.actions';
import { GetService } from '../../store/actions/service.actions';
import { GetSpace } from '../../store/actions/space.actions';
import { AppState } from '../../store/app-state';
import {
  entityFactory,
  organizationSchemaKey,
  serviceBrokerSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanVisibilitySchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../store/helpers/entity-factory';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstanceServicePlan } from '../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../store/types/api.types';
import { getIdFromRoute } from '../cloud-foundry/cf.helpers';
import { CloudFoundryEndpointService } from '../cloud-foundry/services/cloud-foundry-endpoint.service';

export interface ServicePlanAccessibility {
  spaceScoped?: boolean;
  hasVisibilities?: boolean;
  isPublic: boolean;
  guid?: string;
  spaceGuid?: string;
}

@Injectable()
export class ServicesService {
  allServiceInstances$: Observable<APIResource<IServiceInstance>[]>;
  serviceInstances$: Observable<APIResource<IServiceInstance>[]>;
  serviceBrokers$: Observable<APIResource<IServiceBroker>[]>;
  serviceBroker$: Observable<APIResource<IServiceBroker>>;
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

    this.initBaseObservables();
  }

  private getServicePlanVisibilities = () => {
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
  private getServiceInstances = () => {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, this.cfGuid);
    return getPaginationObservables<APIResource<IServiceInstance>>(
      {
        store: this.store,
        action: new GetServiceInstances(this.cfGuid, paginationKey),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(serviceInstancesSchemaKey)
        )
      },
      true
    ).entities$;
  }

  private getServiceBrokers = () => {
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
  getServicePlanVisibilitiesForPlan = (servicePlanGuid: string): Observable<APIResource<IServicePlanVisibility>[]> => {
    return this.servicePlanVisibilities$.pipe(
      filter(p => !!p),
      map(vis => vis.filter(s => s.entity.service_plan_guid === servicePlanGuid)),
      first()
    );
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
      map(([serviceBroker, allServicePlanVisibilities]) => {
        const svcAvailability = {
          isPublic: false, spaceScoped: false, hasVisibilities: false, guid: servicePlan.metadata.guid, spaceGuid: null
        };
        if (serviceBroker.entity.space_guid) {
          svcAvailability.spaceScoped = true;
          svcAvailability.spaceGuid = serviceBroker.entity.space_guid;
        } else {
          const servicePlanVisibilities = allServicePlanVisibilities.filter(
            s => s.entity.service_plan_guid === servicePlan.metadata.guid
          );
          if (servicePlanVisibilities.length > 0) {
            svcAvailability.hasVisibilities = true;
          }
        }
        return svcAvailability;
      })
    );
  }

  getSelectedServicePlan = (): Observable<APIResource<IServicePlan>> => {
    return Observable.combineLatest(this.store.select(selectCreateServiceInstanceServicePlan), this.servicePlans$)
      .pipe(
        filter(([p, q]) => !!p && !!q),
        map(([servicePlanGuid, servicePlans]) => servicePlans.filter(o => o.metadata.guid === servicePlanGuid)),
        map(p => p[0]), filter(p => !!p)
      );
  }


  getSelectedServicePlanAccessibility = () => {
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
        }),
        share(), first()
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

  getServiceDescription = () => {
    return Observable.combineLatest(this.serviceExtraInfo$, this.service$)
      .pipe(
        map(([extraInfo, service]) => {
          if (extraInfo && extraInfo.longDescription) {
            return extraInfo.longDescription;
          } else {
            return service.entity.description;
          }
        }));
  }


  getDocumentationUrl = () => this.serviceExtraInfo$.pipe(
    map(p => p.documentationUrl)
  )

  getSupportUrl = () => this.serviceExtraInfo$.pipe(
    map(p => p.supportUrl)
  )

  hasSupportUrl = () => this.getSupportUrl().pipe(
    map(p => !!p)
  )

  getServiceTags = () => this.service$.pipe(
    first(),
    tap(o => console.log('firing!!')),
    map(service =>
      service.entity.tags.map(t => ({
        value: t,
        hideClearButton: true
      }))
    )
  )


  private initBaseObservables() {
    this.servicePlanVisibilities$ = this.getServicePlanVisibilities();
    this.serviceExtraInfo$ = this.service$.pipe(map(o => JSON.parse(o.entity.extra)));
    this.servicePlans$ = this.service$.pipe(map(o => o.entity.service_plans));
    this.serviceBrokers$ = this.getServiceBrokers();
    this.serviceBroker$ = this.serviceBrokers$.pipe(
      filter(p => !!p && p.length > 0),
      combineLatest(this.service$),
      map(([brokers, service]) => brokers.filter(broker => broker.metadata.guid === service.entity.service_broker_guid)),
      map(o => o[0]));
    this.allServiceInstances$ = this.getServiceInstances();
    this.serviceInstances$ = this.allServiceInstances$.pipe(
      map(instances => instances.filter(instance => instance.entity.service_guid === this.serviceGuid))
    );
  }
}
