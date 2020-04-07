import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { combineLatest, filter, first, map, share, switchMap } from 'rxjs/operators';

import { createEntityRelationPaginationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  IService,
  IServiceBroker,
  IServiceExtra,
  IServiceInstance,
  IServicePlan,
  IServicePlanExtra,
  IServicePlanVisibility,
} from '../../../../core/src/core/cf-api-svc.types';
import { getIdFromRoute, safeStringToObj } from '../../../../core/src/core/utils.service';
import { StratosStatus } from '../../../../core/src/shared/shared.types';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityService } from '../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../../store/src/types/request.types';
import { CFAppState } from '../../cf-app-state';
import { cfEntityFactory } from '../../cf-entity-factory';
import {
  organizationEntityType,
  serviceBrokerEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
  spaceEntityType,
} from '../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { ServiceInstanceActionBuilders } from '../../entity-action-builders/service-instance.action.builders';
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

export const getServiceInstancesInCf = (cfGuid: string, store: Store<CFAppState>, paginationMonitorFactory: PaginationMonitorFactory) => {
  const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, cfGuid);
  const serviceIntanceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
  const actionBuilder = serviceIntanceEntity.actionOrchestrator.getActionBuilder('getMultiple');
  const action = actionBuilder(cfGuid, paginationKey);
  return getPaginationObservables<APIResource<IServiceInstance>>({
    store,
    action,
    paginationMonitor: paginationMonitorFactory.create(paginationKey, action, action.flattenPagination)
  }, action.flattenPagination).entities$;
};

export const fetchServiceInstancesCount = (
  cfGuid: string,
  orgGuid: string = null,
  spaceGuid: string = null,
  store: Store<CFAppState>,
  paginationMonitorFactory: PaginationMonitorFactory): Observable<number> => {
  const parentSchemaKey = spaceGuid ? spaceEntityType : orgGuid ? organizationEntityType : 'cf';
  const uniqueKey = spaceGuid || orgGuid || cfGuid;
  const serviceInstanceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
  const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getMultiple');
  const action = actionBuilder(
    cfGuid,
    createEntityRelationPaginationKey(parentSchemaKey, uniqueKey),
    { includeRelations: [], populateMissing: false }
  );
  action.initialParams.q = [];
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
  cfGuid: string,
  store: Store<CFAppState>,
  paginationMonitorFactory: PaginationMonitorFactory
): Observable<APIResource<IServicePlan>[]> => {
  return service$.pipe(
    filter(p => !!p),
    switchMap(service => {
      if (service.entity.service_plans && service.entity.service_plans.length > 0) {
        return observableOf(service.entity.service_plans);
      } else {
        const guid = service.metadata.guid;
        const paginationKey = createEntityRelationPaginationKey(servicePlanEntityType, guid);
        const servicePlanEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, servicePlanEntityType);
        const actionBuilder = servicePlanEntity.actionOrchestrator.getActionBuilder('getAllForServiceInstance');
        const getServicePlansAction = actionBuilder(guid, cfGuid, paginationKey) as PaginatedAction;
        // Could be a space-scoped service, make a request to fetch the plan
        return getPaginationObservables<APIResource<IServicePlan>>({
          store,
          action: getServicePlansAction,
          paginationMonitor: paginationMonitorFactory.create(
            getServicePlansAction.paginationKey,
            cfEntityFactory(servicePlanEntityType),
            getServicePlansAction.flattenPagination
          )
        }, getServicePlansAction.flattenPagination)
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

export const getEntityService = <T extends IService | IServiceBroker | IServiceInstance>(
  serviceGuid: string,
  entityRequestAction: EntityRequestAction,
  entityServiceFactory: EntityServiceFactory
): EntityService<APIResource<T>> => {
  return entityServiceFactory.create<APIResource<T>>(
    serviceGuid,
    entityRequestAction
  );
};

export const getServiceBroker = (
  serviceBrokerGuid: string,
  cfGuid: string,
  entityServiceFactory: EntityServiceFactory
): EntityService<APIResource<IServiceBroker>> => {
  const serviceBrokerEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceBrokerEntityType);
  const actionBuilder = serviceBrokerEntity.actionOrchestrator.getActionBuilder('get');
  const getServiceBrokerAction = actionBuilder(serviceBrokerGuid, cfGuid);
  return getEntityService(serviceBrokerGuid, getServiceBrokerAction, entityServiceFactory);
};

export const getServiceBrokerName = (
  serviceBrokerGuid: string,
  cfGuid: string,
  entityServiceFactory: EntityServiceFactory): Observable<string> => {
  return getServiceBroker(serviceBrokerGuid, cfGuid, entityServiceFactory).waitForEntity$.pipe(
    filter(res => !!res),
    map(a => a.entity.entity.name),
    first()
  );
};

export const getCfService = (
  serviceGuid: string,
  cfGuid: string,
  entityServiceFactory: EntityServiceFactory
): EntityService<APIResource<IService>> => {
  const serviceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceEntityType);
  const actionBuilder = serviceEntity.actionOrchestrator.getActionBuilder('get');
  const getServiceAction = actionBuilder(serviceGuid, cfGuid);
  return getEntityService(serviceGuid, getServiceAction, entityServiceFactory);
};

export const getCfServiceInstance = (
  serviceInstanceGuid: string,
  cfGuid: string,
  entityServiceFactory: EntityServiceFactory,
  includeRelations: string[] = null
): EntityService<APIResource<IServiceInstance>> => {
  const entity = entityCatalog
    .getEntity<IEntityMetadata, any, ServiceInstanceActionBuilders>(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
  const actionBuilder = entity.actionOrchestrator.getActionBuilder('get');
  const getAction = actionBuilder(
    serviceInstanceGuid,
    cfGuid,
    {
      includeRelations,
      populateMissing: !!includeRelations
    }
  );
  return getEntityService<IServiceInstance>(serviceInstanceGuid, getAction, entityServiceFactory);
};
