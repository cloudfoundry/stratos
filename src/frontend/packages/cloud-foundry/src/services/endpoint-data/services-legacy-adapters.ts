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

import type {
  StServiceBroker,
  StServiceInstance,
  StServicePlan,
} from './stratos-types';

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

// -----------------------------------------------------------------------------
// Service Plan — legacy flat shape → new nested-ref shape. Plan today
// emits serviceOfferingGuid as a flat field; new shape nests it under
// serviceOffering.guid (name resolves at summary+ via the rework's include
// chain).
// -----------------------------------------------------------------------------

interface LegacyServicePlan {
  guid: string;
  cnsiGuid: string;
  name: string;
  description?: string;
  available?: boolean;
  free?: boolean;
  visibilityType?: string;
  serviceOfferingGuid?: string;
  spaceGuid?: string;
  costs?: Array<{ amount: number; currency: string; unit: string }>;
  labels?: { [k: string]: string };
  annotations?: { [k: string]: string };
  createdAt: string;
  updatedAt?: string;
}

export function legacyToStServicePlan(raw: LegacyServicePlan): StServicePlan {
  const out: StServicePlan = {
    guid: raw.guid,
    cnsiGuid: raw.cnsiGuid,
    name: raw.name,
    description: raw.description,
    free: raw.free,
    available: raw.available,
    visibilityType: raw.visibilityType,
    costs: raw.costs,
    labels: raw.labels,
    annotations: raw.annotations,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
  if (raw.serviceOfferingGuid) {
    out.serviceOffering = { guid: raw.serviceOfferingGuid };
  }
  if (raw.spaceGuid) {
    out.space = { guid: raw.spaceGuid };
  }
  return out;
}

// -----------------------------------------------------------------------------
// Service Broker — legacy flat shape → new nested-ref shape. spaceGuid
// nests under space.guid; authUsername stays as a flat tristate-bearing
// field on the entity (frontend `_meta.unavailable` synthesis remains
// until the broker handler rework emits backend `_meta`).
// -----------------------------------------------------------------------------

interface LegacyServiceBroker {
  guid: string;
  cnsiGuid: string;
  name: string;
  url?: string;
  spaceGuid?: string;
  authUsername?: string;
  labels?: { [k: string]: string };
  annotations?: { [k: string]: string };
  createdAt: string;
  updatedAt?: string;
  _meta?: { unavailable?: string[] };
}

export function legacyToStServiceBroker(raw: LegacyServiceBroker): StServiceBroker {
  const out: StServiceBroker = {
    guid: raw.guid,
    cnsiGuid: raw.cnsiGuid,
    name: raw.name,
    url: raw.url,
    authUsername: raw.authUsername,
    labels: raw.labels,
    annotations: raw.annotations,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
  if (raw.spaceGuid) {
    out.space = { guid: raw.spaceGuid };
  }
  if (raw._meta) {
    out._meta = { unavailable: raw._meta.unavailable };
  }
  return out;
}

// (Service Credential Binding adapter retired: the
// /pp/v1/cf/apps/{cnsi}/{app}/service_bindings handler now emits the
// nested-ref shape natively at ?return=summary; consumers read the wire
// shape directly.)
