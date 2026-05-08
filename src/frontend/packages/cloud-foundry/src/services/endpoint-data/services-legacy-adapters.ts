// Wire-boundary adapters: legacy flat-shape → nested-ref Stratos shape.
//
// The services-domain signal+V3 slice rewrites the five service entity
// types to nested-ref form. Until each handler's rework lands the new
// wire shape, consumers receive the OLD flat shape over HTTP and must
// adapt it to the new typed shape at the wire boundary.
//
// Each adapter is paired with a handler rework: when the handler returns
// the new shape natively, the adapter is removed. Step 9 (cleanup)
// confirms nothing imports these adapters anymore.
//
// Offerings does NOT have an adapter — its handler is reworked in the
// same commit set as the type rewrite (pilot end-to-end).

import type { StServiceInstance } from './stratos-types';

// -----------------------------------------------------------------------------
// Service Instance — legacy flat shape (what /cf/service_instances/{cnsi}
// returns today) → new nested-ref shape.
// -----------------------------------------------------------------------------

interface LegacyServiceInstance {
  guid: string;
  name: string;
  type: string;
  cnsiGuid: string;
  spaceGuid?: string;
  servicePlanGuid?: string;
  servicePlanName?: string;
  serviceOfferingGuid?: string;
  serviceOfferingName?: string;
  boundAppCount?: number;
  tags?: string[];
  dashboardUrl?: string;
  syslogDrainUrl?: string;
  routeServiceUrl?: string;
  lastOpType?: string;
  lastOpState?: string;
  lastOpDescription?: string;
  lastOpUpdatedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export function legacyToStServiceInstance(raw: LegacyServiceInstance): StServiceInstance {
  const out: StServiceInstance = {
    guid: raw.guid,
    cnsiGuid: raw.cnsiGuid,
    name: raw.name,
    type: raw.type,
    tags: raw.tags ?? [],
    lastOperation: {
      type: raw.lastOpType,
      state: raw.lastOpState,
      description: raw.lastOpDescription,
      updatedAt: raw.lastOpUpdatedAt,
    },
    space: { guid: raw.spaceGuid ?? '' },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
  if (raw.dashboardUrl) out.dashboardUrl = raw.dashboardUrl;
  if (raw.syslogDrainUrl) out.syslogDrainUrl = raw.syslogDrainUrl;
  if (raw.routeServiceUrl) out.routeServiceUrl = raw.routeServiceUrl;
  if (raw.servicePlanGuid) {
    out.servicePlan = {
      guid: raw.servicePlanGuid,
      name: raw.servicePlanName,
      serviceOffering: raw.serviceOfferingGuid
        ? { guid: raw.serviceOfferingGuid, name: raw.serviceOfferingName }
        : undefined,
    };
  }
  return out;
}

// (Service Plan adapter retired: the /pp/v1/cf/service_plans/{cnsi}
// handler now emits the nested-ref shape natively across all tiers
// with the v3 include chain resolving offering + broker refs in one
// round-trip at ?return=summary+.)
//
// (Service Broker adapter retired: the /pp/v1/cf/service_brokers/{cnsi}
// handler now emits the nested-ref shape natively across all tiers and
// stamps `_meta.unavailable: ['authUsername']` on every non-counts row.)
//
// (Service Credential Binding adapter retired: the
// /pp/v1/cf/apps/{cnsi}/{app}/service_bindings handler now emits the
// nested-ref shape natively at ?return=summary; consumers read the wire
// shape directly.)
