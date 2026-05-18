import { ActivatedRoute } from '@angular/router';
import { Observable, of as observableOf } from 'rxjs';
import { take, combineLatest, filter, map } from 'rxjs/operators';

import { StServicePlan, StServicePlanVisibility } from '../../services/endpoint-data/stratos-types';

import { getIdFromRoute, safeStringToObj } from '../../../../core/src/core/utils.service';
import { APIResource } from '../../../../store/src/types/api.types';
import { StratosStatus } from '../../../../store/src/types/shared.types';
import {
  IService,
  IServiceBroker,
  IServiceExtra,
  IServicePlan,
  IServicePlanExtra,
  IServicePlanVisibility } from '../../cf-api-svc.types';

// ServicePlanAccessibility — legacy-shape aggregate used by the
// getServicePlanAccessibility helper below. Lives here (not on the
// retired ServicesService) so the helper API stays self-contained.
export interface ServicePlanAccessibility {
  spaceScoped?: boolean;
  hasVisibilities?: boolean;
  isPublic: boolean;
  guid?: string;
  spaceGuid?: string;
}

// SpaceScopedService — describes whether a service offering's broker is
// space-scoped (and to which space/org). Consumed by the add-service-
// instance stepper to wire the cancel URL + space context for marketplace
// mode. Was previously exported from ServicesService; lives here now that
// the ngrx-coupled service is gone.
export interface SpaceScopedService {
  isSpaceScoped: boolean;
  spaceGuid?: string;
  orgGuid?: string;
}

export const getSvcAvailability = (
  servicePlan: APIResource<IServicePlan>,
  serviceBroker: APIResource<IServiceBroker>,
  allServicePlanVisibilities: APIResource<IServicePlanVisibility>[]) => {
  const svcAvailability: { isPublic: boolean; spaceScoped: boolean; hasVisibilities: boolean; guid: string; spaceGuid: any } = {
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

export const getServiceName = (serviceEntity: APIResource<IService>): string => {
  if (!serviceEntity || !serviceEntity.entity) {
    return '';
  }
  let extraInfo: IServiceExtra = null;
  try {
    extraInfo = serviceEntity.entity.extra ? JSON.parse(serviceEntity.entity.extra) : null;
  } catch (_e) { /* intentionally empty */ }
  return extraInfo && extraInfo.displayName ? extraInfo.displayName : serviceEntity.entity.label;
};

export const getServiceSummaryUrl = (cfGuid: string, serviceGuid: string): string =>
  `/marketplace/${cfGuid}/${serviceGuid}/summary`;

// Accepts both the V3 nested-ref StServicePlan shape (flat `name`) and the
// legacy IServicePlan shape (`name` + optional `extraTyped.displayName`).
// `extraTyped.displayName` carried open-service-broker catalog overrides on
// the V2 wire; V3 surfaces the same fields under `broker_catalog.metadata`
// which we don't currently project into StServicePlan — so the V3 path
// always falls back to `name` until that projection lands.
export const getServicePlanName = (plan: { name: string, extraTyped?: IServicePlanExtra }): string =>
  plan.extraTyped && plan.extraTyped.displayName ? plan.extraTyped.displayName : plan.name;

/**
 * Adapter at the offering-detail Plans tab data-source boundary: the legacy
 * ngrx pagination still emits APIResource<IServicePlan>, but the table cells
 * and embedded components consume StServicePlan. Maps the legacy V2 entity
 * shape onto the V3 nested-ref shape one row at a time. Limited to fields
 * the Plans tab columns and embedded plan-public/plan-price components
 * actually read — everything else stays unset.
 *
 * Retire when the Plans tab migrates to signal-list-config reading from
 * EndpointDataService.servicePlans() directly.
 */
export const apiResourceToStServicePlan = (
  row: APIResource<IServicePlan>,
): StServicePlan => {
  const e = row.entity;
  const extra = e.extraTyped ?? (e.extra ? safeStringToObj<IServicePlanExtra>(e.extra) : undefined);
  return {
    guid: row.metadata.guid,
    cnsiGuid: e.cfGuid ?? '',
    name: e.name,
    description: e.description,
    free: !!e.free,
    visibilityType: e.public ? 'public' : 'admin',
    costs: extra?.costs?.map(c => {
      // Legacy open-service-broker costs: amount: { [country]: number }.
      // Pick first currency entry for the V3 typed shape.
      const country = Object.keys(c.amount ?? {})[0] ?? '';
      return {
        amount: country ? c.amount[country] : 0,
        currency: country.toUpperCase(),
        unit: c.unit,
      };
    }),
    createdAt: row.metadata.created_at,
    updatedAt: row.metadata.updated_at,
  };
};

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

// V3-native plan accessibility derivation. The V3 service_plan_visibility
// resource encodes everything we need: type ∈ {public, admin, organization,
// space}. `space`/`organization` collapse into the legacy WARNING bucket
// (limited visibility); `admin` is ERROR (no general visibility); `public`
// is OK. No broker traversal required — V3 surfaces the space-scoped intent
// directly on the visibility resource.
//
// `isPublicPlan` is the per-plan public flag (V2 `plan.entity.public` or V3
// `plan.visibilityType === 'public'`). Callers pre-translate so the helper
// stays shape-agnostic across the migration.
export const getPlanAccessibilityV3 = (
  isPublicPlan: boolean,
  visibility: StServicePlanVisibility | null,
): StratosStatus => {
  if (isPublicPlan) {
    return StratosStatus.OK;
  }
  const t = visibility?.type;
  if (t === 'public') {
    return StratosStatus.OK;
  }
  if (t === 'organization' || t === 'space') {
    return StratosStatus.WARNING;
  }
  return StratosStatus.ERROR;
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
    take(1)
  );
};

/*
 * Show service plan costs if the V3 plan has a top-level costs[] array
 * populated (typed flat shape, costs[0].amount). Free plans never show
 * costs. The legacy open-service-broker `extraTyped.costs` path is
 * retired; V3 surfaces costs as a typed top-level field on details.
 */
export const canShowServicePlanCosts = (servicePlan: StServicePlan | null | undefined): boolean => {
  if (!servicePlan || servicePlan.free) {
    return false;
  }
  const costs = servicePlan.costs;
  return !!costs && costs.length > 0 && typeof costs[0].amount === 'number';
};

