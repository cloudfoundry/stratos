import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, first, share, switchMap } from 'rxjs/operators';

import {
  IService,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
} from '../../core/cf-api-svc.types';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { GetServiceInstances } from '../../store/actions/service-instances.actions';
import { GetServicePlansForService } from '../../store/actions/service.actions';
import { AppState } from '../../store/app-state';
import { entityFactory, serviceInstancesSchemaKey, servicePlanSchemaKey } from '../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../store/types/api.types';
import { getIdFromRoute } from '../cloud-foundry/cf.helpers';


export const getSvcAvailability = (servicePlan: APIResource<IServicePlan>,
  serviceBroker: APIResource<IServiceBroker>,
  allServicePlanVisibilities: APIResource<IServicePlanVisibility>[]) => {
  const svcAvailability = {
    isPublic: false, spaceScoped: false, hasVisibilities: false, guid: servicePlan.metadata.guid, spaceGuid: null
  };
  if (serviceBroker && serviceBroker.entity.space_guid) {
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
};

export const getServiceJsonParams = (params: any): {} => {
  let prms = params;
  try {
    prms = JSON.parse(params) || null;
  } catch (e) {
    prms = null;
  }
  return prms;
};


export const isMarketplaceMode = (activatedRoute: ActivatedRoute) => {
  const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
  const cfId = getIdFromRoute(activatedRoute, 'cfId');
  return !!serviceId && !!cfId;
};

export const isAppServicesMode = (activatedRoute: ActivatedRoute) => {
  const id = getIdFromRoute(activatedRoute, 'id');
  const cfId = getIdFromRoute(activatedRoute, 'cfId');
  return !!id && !!cfId;
};
export const isServicesWallMode = (activatedRoute: ActivatedRoute) => {
  const cfId = getIdFromRoute(activatedRoute, 'cfId');
  return !cfId;
};

export const isEditServiceInstanceMode = (activatedRoute: ActivatedRoute) => {
  const serviceInstanceId = getIdFromRoute(activatedRoute, 'serviceInstanceId');
  const cfId = getIdFromRoute(activatedRoute, 'cfId');
  return !!cfId && !!serviceInstanceId;
};

export const getServiceInstancesInCf = (cfGuid: string, store: Store<AppState>, paginationMonitorFactory: PaginationMonitorFactory) => {
  const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, cfGuid);
  return getPaginationObservables<APIResource<IServiceInstance>>({
    store: store,
    action: new GetServiceInstances(cfGuid, paginationKey),
    paginationMonitor: paginationMonitorFactory.create(paginationKey, entityFactory(serviceInstancesSchemaKey))
  }, true).entities$;
};

export const getServicePlans = (
  service$: Observable<APIResource<IService>>,
  cfGuid: string,
  store: Store<AppState>,
  paginationMonitorFactory: PaginationMonitorFactory
): Observable<APIResource<IServicePlan>[]> => {
  return service$.pipe(
    filter(p => !!p),
    switchMap(service => {
      if (service.entity.service_plans && service.entity.service_plans.length > 0) {
        return observableOf(service.entity.service_plans);
      } else {
        const guid = service.metadata.guid;
        const paginationKey = createEntityRelationPaginationKey(servicePlanSchemaKey, guid);
        const getServicePlansAction = new GetServicePlansForService(guid, cfGuid, paginationKey);
        // Could be a space-scoped service, make a request to fetch the plan
        return getPaginationObservables<APIResource<IServicePlan>>({
          store: store,
          action: getServicePlansAction,
          paginationMonitor: paginationMonitorFactory.create(getServicePlansAction.paginationKey, entityFactory(servicePlanSchemaKey))
        }, true)
          .entities$.pipe(share(), first());
      }
    }));
};
