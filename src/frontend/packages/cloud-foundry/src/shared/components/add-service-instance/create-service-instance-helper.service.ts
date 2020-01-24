import { Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { serviceInstancesEntityType, servicePlanVisibilityEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  IService,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
} from '../../../../../core/src/core/cf-api-svc.types';
import { CF_GUID } from '../../../../../core/src/shared/entity.tokens';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../store/src/types/api.types';
import { cfEntityFactory } from '../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../cf-types';
import { getCfService, getServiceBroker, getServiceName, getServicePlans } from '../../../features/service-catalog/services-helper';
import { QParam, QParamJoiners } from '../../q-param';

export class CreateServiceInstanceHelper {
  servicePlanVisibilities$: Observable<APIResource<IServicePlanVisibility>[]>;
  service$: Observable<APIResource<IService>>;
  serviceBroker$: Observable<APIResource<IServiceBroker>>;
  // Is instance being created from the Marketplace
  public marketPlaceMode = false;

  constructor(
    private store: Store<CFAppState>,
    public serviceGuid: string,
    @Inject(CF_GUID) public cfGuid: string,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.initBaseObservables();
  }

  initBaseObservables = () => {

    const serviceEntityService = getCfService(this.serviceGuid, this.cfGuid, this.entityServiceFactory);

    this.service$ = serviceEntityService.waitForEntity$.pipe(
      filter(o => !!o && !!o.entity && !!o.entity.entity && !!o.entity.entity.service_plans),
      // filter(o => !!o && !!o.entity),
      map(o => o.entity),
      publishReplay(1),
      refCount()
    );

    this.serviceBroker$ = this.service$.pipe(
      map(service => getServiceBroker(service.entity.service_broker_guid, this.cfGuid, this.entityServiceFactory)),
      switchMap(serviceService => serviceService.waitForEntity$),
      map(entity => entity.entity)
    );

    const paginationKey = createEntityRelationPaginationKey(servicePlanVisibilityEntityType, this.cfGuid);
    const servicePlanVisibilityEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, servicePlanVisibilityEntityType);
    const actionBuilder = servicePlanVisibilityEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const getServicePlanVisibilitiesAction = actionBuilder(this.cfGuid, paginationKey);
    this.servicePlanVisibilities$ = getPaginationObservables<APIResource<IServicePlanVisibility>>(
      {
        store: this.store,
        action: getServicePlanVisibilitiesAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          cfEntityFactory(servicePlanVisibilityEntityType)
        )
      },
      true
    ).entities$;

  }

  getServicePlanVisibilities = (): Observable<APIResource<IServicePlanVisibility>[]> =>
    this.servicePlanVisibilities$.pipe(filter(p => !!p))

  // getServicePlanVisibilitiesForOrg = (orgGuid: string): Observable<APIResource<IServicePlanVisibility>[]> =>
  //   this.servicePlanVisibilities$.pipe(
  //     filter(p => !!p),
  //     map(entities => entities.filter(entity => entity.entity.organization_guid === orgGuid))
  //   )

  getServicePlans(): Observable<APIResource<IServicePlan>[]> {
    return getServicePlans(this.service$, this.cfGuid, this.store, this.paginationMonitorFactory);
  }

  getServiceName = () => {
    return this.service$
      .pipe(
        filter(p => !!p),
        map(getServiceName)
      );
  }

  // getSelectedServicePlan = (): Observable<APIResource<IServicePlan>> => {
  //   return observableCombineLatest(this.store.select(selectCreateServiceInstanceServicePlan), this.getServicePlans())
  //     .pipe(
  //       filter(([p, q]) => !!p && !!q),
  //       map(([servicePlanGuid, servicePlans]) => servicePlans.filter(o => o.metadata.guid === servicePlanGuid)),
  //       map(p => p[0]), filter(p => !!p)
  //     );
  // }

  // getSelectedServicePlanAccessibility = (): Observable<ServicePlanAccessibility> => {
  //   return this.getSelectedServicePlan().pipe(
  //     switchMap(plan => getServicePlanAccessibility(plan, this.getServicePlanVisibilities()))
  //   );
  // }

  // getOrgsForSelectedServicePlan = (): Observable<APIResource<IOrganization>[]> => {
  //   return this.getSelectedServicePlan()
  //     .pipe(
  //       switchMap(servicePlan => getServicePlanAccessibility(servicePlan, this.getServicePlanVisibilities())),
  //       switchMap(servicePlanAccessibility => {
  //         if (servicePlanAccessibility.isPublic) {
  //           const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizationsLimitedSchema(this.cfGuid);
  //           return getPaginationObservables<APIResource<IOrganization>>({
  //             store: this.store,
  //             action: getAllOrgsAction,
  //             paginationMonitor: this.paginationMonitorFactory.create(
  //               getAllOrgsAction.paginationKey,
  //               cfEntityFactory(organizationEntityType)
  //             )
  //           }, true)
  //             .entities$.pipe(share(), first());
  //         } else if (servicePlanAccessibility.spaceScoped) {
  //           // Service plan is not public, but is space-scoped
  //           const action = new GetSpace(servicePlanAccessibility.spaceGuid, this.cfGuid,
  //             [
  //               createEntityRelationKey(spaceEntityType, organizationEntityType),
  //             ]
  //           );
  //           action.entity = [cfEntityFactory(spaceWithOrgEntityType)];
  //           return this.entityServiceFactory.create<APIResource<ISpace>>(
  //             spaceEntityType,
  //             cfEntityFactory(spaceWithOrgEntityType),
  //             servicePlanAccessibility.spaceGuid,
  //             action,
  //             true
  //           ).waitForEntity$
  //             .pipe(
  //               // Block until the org is either fetched or associated with existing entity
  //               filter(p => !!pathGet('entity.entity.organization.entity', p)),
  //               map((p) => {
  //                 const orgEntity = { ...p.entity.entity.organization.entity, spaces: [p.entity] };
  //                 return [{ ...p.entity.entity.organization, entity: orgEntity }];
  //               }),
  //             );
  //         } else if (servicePlanAccessibility.hasVisibilities) {
  //           // Service plan is not public, fetch visibilities
  //           return this.getServicePlanVisibilitiesForPlan(servicePlanAccessibility.guid)
  //             .pipe(
  //               map(s => s.map(o => o.entity.organization)),
  //             );
  //         }
  //       }
  //       ),
  //       share(), first()
  //     );
  // }

  // getServicePlanVisibilitiesForPlan = (servicePlanGuid: string): Observable<APIResource<IServicePlanVisibility>[]> => {
  //   return this.getServicePlanVisibilities().pipe(
  //     filter(p => !!p),
  //     map(vis => vis.filter(s => s.entity.service_plan_guid === servicePlanGuid)),
  //     first()
  //   );
  // }

  getServiceInstancesForService = (servicePlanGuid: string = null, spaceGuid: string = null, cfGuid: string = null) => {
    let action;
    let paginationKey;
    const serviceInstanceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
    if (spaceGuid) {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, `${spaceGuid}-${servicePlanGuid}`);
      const q = [new QParam('service_plan_guid', servicePlanGuid, QParamJoiners.colon).toString()];
      const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
      action = actionBuilder(spaceGuid, cfGuid, paginationKey, q);
    } else if (servicePlanGuid) {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, servicePlanGuid);
      const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getAllInServicePlan');
      action = actionBuilder(servicePlanGuid, cfGuid, paginationKey);
    } else {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, cfGuid);
      const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getMultiple');
      action = actionBuilder(cfGuid, paginationKey);
    }
    return getPaginationObservables<APIResource<IServiceInstance>>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        paginationKey,
        cfEntityFactory(serviceInstancesEntityType)
      )
    }, true)
      .entities$.pipe(
        publishReplay(1),
        refCount()
      );
  }

  // getServicesForSpace = (spaceGuid: string, cfGuid: string) => {
  //   const paginationKey = createEntityRelationPaginationKey(serviceEntityType, spaceGuid);
  //   return getPaginationObservables<APIResource<IService>>(
  //     {
  //       store: this.store,
  //       action: new GetAllServicesForSpace(paginationKey, cfGuid, spaceGuid),
  //       paginationMonitor: this.paginationMonitorFactory.create(
  //         paginationKey,
  //         entityFactory(serviceEntityType)
  //       )
  //     },
  //     true
  //   ).entities$.pipe(
  //     filter(p => !!p),
  //     publishReplay(1),
  //     refCount()
  //   );
  // }

}
