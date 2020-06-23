import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { combineLatest, filter, first, map, share, switchMap } from 'rxjs/operators';

import { createEntityRelationPaginationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { getIdFromRoute, safeStringToObj } from '../../../../core/src/core/utils.service';
import { EntityService } from '../../../../store/src/entity-service';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../store/src/types/api.types';
import { StratosStatus } from '../../../../store/src/types/shared.types';
import {
  IService,
  IServiceBroker,
  IServiceExtra,
  IServiceInstance,
  IServicePlan,
  IServicePlanExtra,
  IServicePlanVisibility,
} from '../../cf-api-svc.types';
import { CFAppState } from '../../cf-app-state';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { organizationEntityType, servicePlanEntityType, spaceEntityType } from '../../cf-entity-types';
import { QParam, QParamJoiners } from '../../shared/q-param';
import { fetchTotalResults } from '../cloud-foundry/cf.helpers';
import { ServicePlanAccessibility } from './services.service';

export const getSvcAvailability = (
  servicePlan: APIResource<IServicePlan>,
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

export const fetchServiceInstancesCount = (
  cfGuid: string,
  orgGuid: string = null,
  spaceGuid: string = null,
  store: Store<CFAppState>,
  paginationMonitorFactory: PaginationMonitorFactory): Observable<number> => {
  const parentSchemaKey = spaceGuid ? spaceEntityType : orgGuid ? organizationEntityType : 'cf';
  const uniqueKey = spaceGuid || orgGuid || cfGuid;
  const action = cfEntityCatalog.serviceInstance.actions.getMultiple(
    cfGuid,
    createEntityRelationPaginationKey(parentSchemaKey, uniqueKey),
    { includeRelations: [], populateMissing: false }
  )
  if (orgGuid) {
    action.initialParams.q.push(new QParam('organization_guid', orgGuid, QParamJoiners.in).toString());
  }
  if (spaceGuid) {
    action.initialParams.q.push(new QParam('space_guid', spaceGuid, QParamJoiners.in).toString());
  }
  return fetchTotalResults(action, store, paginationMonitorFactory);
};

export const getServiceName = (serviceEntity: APIResource<IService>): string => {
  let extraInfo: IServiceExtra = null;
  try {
    extraInfo = serviceEntity.entity.extra ? JSON.parse(serviceEntity.entity.extra) : null;
  } catch (e) { }
  return extraInfo && extraInfo.displayName ? extraInfo.displayName : serviceEntity.entity.label;
};

export const getServiceSummaryUrl = (cfGuid: string, serviceGuid: string): string =>
  `/marketplace/${cfGuid}/${serviceGuid}/summary`;

export const getServicePlans = (
  service$: Observable<APIResource<IService>>,
  cfGuid: string
): Observable<APIResource<IServicePlan>[]> => {
  return service$.pipe(
    filter(p => !!p),
    switchMap(service => {
      if (service.entity.service_plans && service.entity.service_plans.length > 0) {
        return observableOf(service.entity.service_plans);
      } else {
        // Could be a space-scoped service, make a request to fetch the plan
        const guid = service.metadata.guid;
        const paginationKey = createEntityRelationPaginationKey(servicePlanEntityType, guid);
        return cfEntityCatalog.servicePlan.store.getAllForServiceInstance.getPaginationService(
          guid, cfGuid, paginationKey
        ).entities$.pipe(share(), first());
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
  serviceBroker$: Observable<APIResource<IServiceBroker>>): Observable<StratosStatus> => {
  return getServicePlanAccessibility(servicePlan, servicePlanVisibilities$, serviceBroker$).pipe(
    map((servicePlanAccessibility: ServicePlanAccessibility) => {
      if (servicePlanAccessibility.isPublic) {
        return StratosStatus.OK;
      } else if (servicePlanAccessibility.spaceScoped || servicePlanAccessibility.hasVisibilities) {
        return StratosStatus.WARNING;
      } else {
        return StratosStatus.ERROR;
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

export const getServiceBrokerName = (
  serviceBrokerGuid: string,
  cfGuid: string,
): Observable<string> => cfEntityCatalog.serviceBroker.store.getEntityService(serviceBrokerGuid, cfGuid, {}).waitForEntity$.pipe(
  filter(res => !!res),
  map(a => a.entity.entity.name),
  first()
);

export const getCfServiceInstance = (
  serviceInstanceGuid: string,
  cfGuid: string,
  includeRelations: string[] = null
): EntityService<APIResource<IServiceInstance>> => {
  return cfEntityCatalog.serviceInstance.store.getEntityService(
    serviceInstanceGuid,
    cfGuid,
    {
      includeRelations,
      populateMissing: !!includeRelations
    }
  )
};
