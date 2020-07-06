import { Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import {
  serviceInstancesEntityType,
  servicePlanVisibilityEntityType,
} from '../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { CF_GUID } from '../../../../../core/src/shared/entity.tokens';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IService, IServiceBroker, IServiceInstance, IServicePlan, IServicePlanVisibility } from '../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../cf-entity-factory';
import { getServiceName, getServicePlans } from '../../../features/service-catalog/services-helper';
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
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.initBaseObservables();
  }

  initBaseObservables = () => {

    this.service$ = cfEntityCatalog.service.store.getEntityService(this.serviceGuid, this.cfGuid, {}).waitForEntity$.pipe(
      filter(o => !!o && !!o.entity && !!o.entity.entity && !!o.entity.entity.service_plans),
      // filter(o => !!o && !!o.entity),
      map(o => o.entity),
      publishReplay(1),
      refCount()
    );

    this.serviceBroker$ = this.service$.pipe(
      map(service => cfEntityCatalog.serviceBroker.store.getEntityService(service.entity.service_broker_guid, this.cfGuid, {})),
      switchMap(serviceService => serviceService.waitForEntity$),
      map(entity => entity.entity)
    );

    const paginationKey = createEntityRelationPaginationKey(servicePlanVisibilityEntityType, this.cfGuid);
    this.servicePlanVisibilities$ = cfEntityCatalog.servicePlanVisibility.store.getPaginationService(this.cfGuid, paginationKey, {}).entities$
  }

  getServicePlanVisibilities = (): Observable<APIResource<IServicePlanVisibility>[]> =>
    this.servicePlanVisibilities$.pipe(filter(p => !!p))


  getServicePlans(): Observable<APIResource<IServicePlan>[]> {
    return getServicePlans(this.service$, this.cfGuid);
  }

  getServiceName = () => {
    return this.service$
      .pipe(
        filter(p => !!p),
        map(getServiceName)
      );
  }

  getServiceInstancesForService = (servicePlanGuid: string = null, spaceGuid: string = null, cfGuid: string = null) => {
    let action;
    let paginationKey;
    if (spaceGuid) {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, `${spaceGuid}-${servicePlanGuid}`);
      const q = [new QParam('service_plan_guid', servicePlanGuid, QParamJoiners.colon).toString()];
      action = cfEntityCatalog.serviceInstance.actions.getAllInSpace(spaceGuid, cfGuid, paginationKey, q)
    } else if (servicePlanGuid) {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, servicePlanGuid);
      action = cfEntityCatalog.serviceInstance.actions.getAllInServicePlan(servicePlanGuid, cfGuid, paginationKey);
    } else {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, cfGuid);
      action = cfEntityCatalog.serviceInstance.actions.getMultiple(cfGuid, paginationKey);
    }
    return getPaginationObservables<APIResource<IServiceInstance>>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        paginationKey,
        cfEntityFactory(serviceInstancesEntityType),
        action.flattenPagination
      )
    }, action.flattenPagination)
      .entities$.pipe(
        publishReplay(1),
        refCount()
      );
  }
}
