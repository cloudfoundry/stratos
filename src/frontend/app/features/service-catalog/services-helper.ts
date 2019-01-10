import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { combineLatest, filter, first, map, share, switchMap } from 'rxjs/operators';

import {
  IService,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanExtra,
  IServicePlanVisibility,
} from '../../core/cf-api-svc.types';
import { EntityService } from '../../core/entity-service';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { safeStringToObj } from '../../core/utils.service';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { CardStatus } from '../../shared/shared.types';
import { GetServiceBroker } from '../../store/actions/service-broker.actions';
import { GetServiceInstances } from '../../store/actions/service-instances.actions';
import { GetService, GetServicePlansForService } from '../../store/actions/service.actions';
import { AppState } from '../../store/app-state';
import {
  entityFactory,
  serviceBrokerSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  serviceSchemaKey,
} from '../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../store/types/api.types';
import { getIdFromRoute } from '../cloud-foundry/cf.helpers';
import { ServicePlanAccessibility } from './services.service';

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

export const isMarketplaceMode = (activatedRoute: ActivatedRoute) => {
  const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
  const cfId = getIdFromRoute(activatedRoute, 'endpointId');
  return !!serviceId && !!cfId;
};

export const isAppServicesMode = (activatedRoute: ActivatedRoute) => {
  const id = getIdFromRoute(activatedRoute, 'id');
  const cfId = getIdFromRoute(activatedRoute, 'endpointId');
  return !!id && !!cfId;
};
export const isServicesWallMode = (activatedRoute: ActivatedRoute) => {
  const cfId = getIdFromRoute(activatedRoute, 'endpointId');
  return !cfId;
};

export const isEditServiceInstanceMode = (activatedRoute: ActivatedRoute) => {
  const serviceInstanceId = getIdFromRoute(activatedRoute, 'serviceInstanceId');
  const cfId = getIdFromRoute(activatedRoute, 'endpointId');
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

export const getServicePlanName = (plan: { name: string, extraTyped?: IServicePlanExtra }): string =>
  plan.extraTyped && plan.extraTyped.displayName ? plan.extraTyped.displayName : plan.name;

export const getServicePlanAccessibility = (
  servicePlan: APIResource<IServicePlan>,
  servicePlanVisibilities$: Observable<APIResource<IServicePlanVisibility>[]>,
  serviceBroker$: Observable<APIResource<IServiceBroker>>): Observable<ServicePlanAccessibility> => {
  if (servicePlan.entity.public) {
    return observableOf({
      isPublic: true,
      guid: servicePlan.metadata.guid
    });
  }
  const safeServiceBroker$ = serviceBroker$.pipe(filter(sb => !!sb));
  const safeServicePlanVisibilities$ = servicePlanVisibilities$.pipe(filter(spv => !!spv));
  return safeServiceBroker$.pipe(
    combineLatest(safeServicePlanVisibilities$),
    map(([serviceBroker, allServicePlanVisibilities]) => getSvcAvailability(servicePlan, serviceBroker, allServicePlanVisibilities))
  );
};

export const getServicePlanAccessibilityCardStatus = (
  servicePlan: APIResource<IServicePlan>,
  servicePlanVisibilities$: Observable<APIResource<IServicePlanVisibility>[]>,
  serviceBroker$: Observable<APIResource<IServiceBroker>>): Observable<CardStatus> => {
  return getServicePlanAccessibility(servicePlan, servicePlanVisibilities$, serviceBroker$).pipe(
    map((servicePlanAccessibility: ServicePlanAccessibility) => {
      if (servicePlanAccessibility.isPublic) {
        return CardStatus.OK;
      } else if (servicePlanAccessibility.spaceScoped || servicePlanAccessibility.hasVisibilities) {
        return CardStatus.WARNING;
      } else {
        return CardStatus.ERROR;
      }
    }),
    first()
  );
};

/*
* Show service plan costs if the object is in the open service broker format, otherwise ignore them
*/
export const canShowServicePlanCosts = (servicePlan: APIResource<IServicePlan>): boolean => {
  if (!servicePlan || servicePlan.entity.free) {
    return false;
  }
  const extra = servicePlan.entity.extraTyped;
  return !!extra && !!extra.costs && !!extra.costs[0] && !!extra.costs[0].amount;
};

export const populateServicePlanExtraTyped = (servicePlan: APIResource<IServicePlan>): APIResource<IServicePlan> => {
  if (servicePlan.entity.extraTyped) {
    return servicePlan;
  }
  return {
    ...servicePlan,
    entity: {
      ...servicePlan.entity,
      extraTyped: servicePlan.entity.extra ? safeStringToObj<IServicePlanExtra>(servicePlan.entity.extra) : null
    }
  };
};

export const getServiceBroker = (
  serviceBrokerGuid: string,
  cfGuid: string,
  entityServiceFactory: EntityServiceFactory): EntityService<APIResource<IServiceBroker>> => {
  return entityServiceFactory.create<APIResource<IServiceBroker>>(
    serviceBrokerSchemaKey,
    entityFactory(serviceBrokerSchemaKey),
    serviceBrokerGuid,
    new GetServiceBroker(serviceBrokerGuid, cfGuid),
    false
  );
};

export const getCfService = (
  serviceGuid: string,
  cfGuid: string,
  entityServiceFactory: EntityServiceFactory): EntityService<APIResource<IService>> => {
  return entityServiceFactory.create<APIResource<IService>>(
    serviceSchemaKey,
    entityFactory(serviceSchemaKey),
    serviceGuid,
    new GetService(serviceGuid, cfGuid),
    true
  );
};
