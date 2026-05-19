import { OrgQuotaWriteBody, SpaceQuotaWriteBody } from '../../../services/endpoint-data/quota-data.service';
import { StOrgQuota, StSpaceQuota } from '../../../services/endpoint-data/stratos-types';

export interface OrgQuotaFormValues {
  name: string;
  totalServices: number | string;
  totalRoutes: number | string;
  memoryLimit: number | string;
  appTasksLimit: number | string;
  totalPrivateDomains: number | string;
  totalServiceKeys: number | string;
  instanceMemoryLimit: number | string;
  nonBasicServicesAllowed: boolean;
  totalReservedRoutePorts: number | string;
  appInstanceLimit: number | string;
}

export type SpaceQuotaFormValues = Omit<OrgQuotaFormValues, 'totalPrivateDomains'>;

// UnlimitedInputComponent emits '' for "Unlimited" (checkbox checked,
// control disabled with empty string) and a non-negative number otherwise.
// V3 wants `null` for Unlimited, so we coerce both '' and -1 (the legacy
// V2 sentinel) to null.
function limitToWire(v: number | string | null | undefined): number | null {
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v === 'number' && v < 0) return null;
  return Number(v);
}

export function formToOrgQuotaWriteBody(values: OrgQuotaFormValues): OrgQuotaWriteBody {
  return {
    name: values.name,
    apps: {
      total_memory_in_mb: limitToWire(values.memoryLimit),
      total_instance_memory_in_mb: limitToWire(values.instanceMemoryLimit),
      total_instances: limitToWire(values.appInstanceLimit),
      total_app_tasks: limitToWire(values.appTasksLimit),
    },
    services: {
      paid_services_allowed: !!values.nonBasicServicesAllowed,
      total_service_instances: limitToWire(values.totalServices),
      total_service_keys: limitToWire(values.totalServiceKeys),
    },
    routes: {
      total_routes: limitToWire(values.totalRoutes),
      total_reserved_ports: limitToWire(values.totalReservedRoutePorts),
    },
    domains: {
      total_domains: limitToWire(values.totalPrivateDomains),
    },
  };
}

export function formToSpaceQuotaCreateBody(values: SpaceQuotaFormValues, organizationGuid: string): SpaceQuotaWriteBody {
  return {
    ...formToSpaceQuotaUpdateBody(values),
    relationships: { organization: { data: { guid: organizationGuid } } },
  };
}

export function formToSpaceQuotaUpdateBody(values: SpaceQuotaFormValues): SpaceQuotaWriteBody {
  return {
    name: values.name,
    apps: {
      total_memory_in_mb: limitToWire(values.memoryLimit),
      total_instance_memory_in_mb: limitToWire(values.instanceMemoryLimit),
      total_instances: limitToWire(values.appInstanceLimit),
      total_app_tasks: limitToWire(values.appTasksLimit),
    },
    services: {
      paid_services_allowed: !!values.nonBasicServicesAllowed,
      total_service_instances: limitToWire(values.totalServices),
      total_service_keys: limitToWire(values.totalServiceKeys),
    },
    routes: {
      total_routes: limitToWire(values.totalRoutes),
      total_reserved_ports: limitToWire(values.totalReservedRoutePorts),
    },
  };
}

// Form display values use the V3 sentinel -1 for "Unlimited" so that
// UnlimitedInputComponent picks up the checkbox state on mount.
export function orgQuotaToFormValues(q: StOrgQuota): OrgQuotaFormValues {
  return {
    name: q.name,
    totalServices: q.totalServiceInstances,
    totalRoutes: q.totalRoutes,
    memoryLimit: q.totalMemoryInMB,
    appTasksLimit: q.totalAppTasks,
    totalPrivateDomains: q.totalDomains,
    totalServiceKeys: q.totalServiceKeys,
    instanceMemoryLimit: q.totalInstanceMemoryInMB,
    nonBasicServicesAllowed: q.paidServicesAllowed,
    totalReservedRoutePorts: q.totalReservedPorts,
    appInstanceLimit: q.totalInstances,
  };
}

export function spaceQuotaToFormValues(q: StSpaceQuota): SpaceQuotaFormValues {
  return {
    name: q.name,
    totalServices: q.totalServiceInstances,
    totalRoutes: q.totalRoutes,
    memoryLimit: q.totalMemoryInMB,
    appTasksLimit: q.totalAppTasks,
    totalServiceKeys: q.totalServiceKeys,
    instanceMemoryLimit: q.totalInstanceMemoryInMB,
    nonBasicServicesAllowed: q.paidServicesAllowed,
    totalReservedRoutePorts: q.totalReservedPorts,
    appInstanceLimit: q.totalInstances,
  };
}
