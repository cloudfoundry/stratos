// src/frontend/packages/cloud-foundry/src/services/v3-to-legacy-adapter.ts
//
// Stratos-shape (v3-composed) → legacy v2 shape adapter. The Stratos
// data model (StAppDetail, StEnvVars, StAppStat, etc.) is the
// canonical wire contract; this file manufactures the v2-flavored
// `APIResource<IApp>` / `IAppSummary` / `AppEnvVarsState` shapes that
// unmigrated ngrx consumers still depend on.
//
// Lifecycle: each entry function exists only as long as some consumer
// of the legacy shape still does. Slice migrations delete their own
// entry function as they go; the file dies when the last consumer
// migrates. Treat this as the v3-shim graveyard — slices 2..N add
// entries here for their own resources (`stToLegacy.serviceInstance`,
// `stToLegacy.organization`, etc.) following the same shape.

import { APIResource } from '@stratosui/store';
import { IApp, IAppSummary } from '../cf-api.types';
import { AppStat, AppEnvVarsState } from '../store/types/app-metadata.types';
import {
  StAppDetail,
  StAppStat,
  StEnvVars,
} from './endpoint-data/stratos-types';

/**
 * Build the legacy v2 `APIResource<IApp>` shape from a Stratos-shape
 * `StAppDetail`. The result mirrors what the ngrx app entity store
 * would have populated via `GetApplication` — flat IApp fields under
 * `entity`, GUID echoed under both `entity.guid` and `metadata.guid`,
 * and the lifecycle fields (stack/buildpack/command/health-check)
 * lifted out of the embedded process+droplet sub-objects so unmigrated
 * templates can read `app.entity.entity.stack.entity.name` etc.
 *
 * Sub-resources missing from the envelope (listed in `_meta.unavailable`)
 * leave their corresponding legacy field as `undefined` — same behavior
 * as a v2 inline-relation that wasn't fetched.
 */
function appDetailToLegacy(detail: StAppDetail | undefined): APIResource<IApp> | null {
  if (!detail?.app) {
    return null;
  }
  const app = detail.app;
  const process = detail.process;
  const droplet = detail.droplet;
  const pkg = detail.pkg;
  const build = detail.build;

  const entity: IApp = {
    name: app.name,
    guid: app.guid,
    cfGuid: app.cnsiGuid,
    space_guid: app.spaceGuid,
    state: app.state,
    instances: app.instances ?? process?.instances ?? 0,
    memory: app.memory ?? process?.memoryMb,
    disk_quota: app.diskQuota ?? process?.diskMb,
    enable_ssh: detail.sshEnabled,
    // Lifecycle fields lifted from the droplet. `buildpack` legacy was a
    // single string; v3 droplets carry a list. First entry is the
    // detected buildpack; falls back undefined for docker lifecycle.
    buildpack: droplet?.buildpacks?.[0]?.name,
    detected_buildpack: droplet?.buildpacks?.[0]?.detectOutput,
    // Stack on the legacy shape was an APIResource<IStack> with the
    // name nested at .entity.name. Synthesise a minimal wrapper so
    // templates reading `.stack.entity.name` continue to work.
    stack: app.stackName
      ? ({ entity: { name: app.stackName, guid: '' }, metadata: { guid: '', url: '' } } as any)
      : undefined,
    // Process-derived runtime config fields.
    command: process?.command,
    // Legacy IApp had a `detected_start_command` separate from `command`
    // (CF v2 returned both: user-set vs auto-detected). V3 collapses them
    // into a single `command` field that already resolves to the detected
    // command when no user override exists. Mirror the same value into
    // both legacy slots so consumers reading either continue to work.
    detected_start_command: process?.command,
    ports: process?.ports,
    health_check_type: process?.healthCheckType,
    health_check_timeout: process?.healthCheckTimeoutSeconds,
    health_check_http_endpoint: process?.healthCheckEndpoint,
    // Docker lifecycle: the image lives on the droplet. Buildpack-lifecycle
    // droplets carry no image; the legacy field stays undefined for those.
    docker_image: droplet?.image,
    // Package + build state drive Summary tab "package state" /
    // "staging failed reason" cells.
    package_state: pkg?.state,
    package_updated_at: pkg?.updatedAt,
    staging_failed_description: build?.error,
  };

  return {
    entity,
    metadata: {
      guid: app.guid,
      url: '',
      created_at: app.createdAt,
      updated_at: app.updatedAt,
    },
  };
}

/**
 * Build the legacy `IAppSummary` shape from `StAppDetail`. The Stratos
 * data model doesn't ship a separate /summary wire endpoint; the data
 * service stores one signal (`appDetail`) and exposes the legacy
 * summary shape via this adapter for unmigrated callers.
 *
 * `routes` and `services` come straight off `StAppDetail.app.routes`
 * (already in StAppRoute shape) and the StAppDetail-level service
 * binding fan-out — but slice 1's StAppDetail does not yet embed
 * service bindings (kept on its own /service_bindings sub-resource per
 * the wire contract), so `services` defaults to `[]` here. A consumer
 * that needs the bindings reads them from
 * `cfClient.serviceBindings.api.getMultiple(appGuid, cfGuid)` directly
 * — same pattern slice 2 will use for service-instance summary.
 */
function appDetailToLegacySummary(detail: StAppDetail | undefined): IAppSummary | null {
  if (!detail?.app) {
    return null;
  }
  const app = detail.app;
  const process = detail.process;
  const droplet = detail.droplet;
  const pkg = detail.pkg;
  const build = detail.build;

  return {
    guid: app.guid,
    name: app.name,
    state: app.state,
    space_guid: app.spaceGuid,
    routes: (app.routes ?? []).map(r => ({
      guid: r.guid,
      host: '',
      path: '',
      port: 0,
      domain: { guid: '', name: '' },
      url: r.url,
    } as any)),
    running_instances: process?.instances ?? 0,
    services: [],
    available_domains: [],
    production: false,
    stack_guid: '',
    buildpack: droplet?.buildpacks?.[0]?.name,
    detected_buildpack: droplet?.buildpacks?.[0]?.detectOutput ?? '',
    detected_buildpack_guid: '',
    environment_json: {},
    memory: process?.memoryMb ?? 0,
    instances: process?.instances ?? 0,
    disk_quota: process?.diskMb ?? 0,
    version: '',
    command: process?.command,
    console: false,
    staging_task_id: '',
    package_state: pkg?.state ?? '',
    health_check_type: process?.healthCheckType ?? '',
    health_check_timeout: process?.healthCheckTimeoutSeconds,
    health_check_http_endpoint: process?.healthCheckEndpoint ?? '',
    staging_failed_description: build?.error,
    diego: true,
    package_updated_at: pkg?.updatedAt ? new Date(pkg.updatedAt) : (undefined as any),
    detected_start_command: process?.command ?? '',
    enable_ssh: detail.sshEnabled,
    ports: process?.ports,
  };
}

/**
 * Build the legacy `AppEnvVarsState` shape from `StEnvVars`. Field
 * names are the v2 snake_case form ngrx consumers expect; values are
 * passed through unchanged because both shapes carry typed values
 * (CF v3 lets brokers inject non-string env values into VCAP_SERVICES).
 */
function envVarsToLegacy(env: StEnvVars | undefined): AppEnvVarsState | null {
  if (!env) {
    return null;
  }
  return {
    environment_json: env.environment as any,
    application_env_json: env.applicationProvided,
    running_env_json: env.runningProvided,
    staging_env_json: env.stagingProvided,
    system_env_json: env.systemProvided,
  };
}

/**
 * Build the legacy `AppStat[]` shape from the V3 `StAppStat[]` returned
 * by `/cf/app-stats/:cnsi/:appGuid`. Wire shape carries the full
 * per-instance metrics (uptime + quotas + usage) so the auto-scaler /
 * app-monitor / Instances-tab consumers all read real values, not
 * placeholders. CRASHED / STARTING instances may arrive with
 * `usage` absent — preserve the zero defaults for those, mirroring CF
 * behavior of not emitting usage for non-RUNNING states.
 */
function appStatsToLegacy(
  stats: StAppStat[],
  cfGuid: string,
  appGuid: string,
): AppStat[] {
  return stats.map(s => ({
    cfGuid,
    guid: appGuid,
    state: s.state,
    stats: {
      disk_quota: s.diskQuota ?? 0,
      fds_quota: s.fdsQuota ?? 0,
      host: s.host ?? '',
      mem_quota: s.memQuota ?? 0,
      name: '',
      port: 0,
      uptime: s.uptime ?? 0,
      uris: [] as string[],
      usage: {
        cpu: s.usage?.cpu ?? 0,
        disk: s.usage?.disk ?? 0,
        mem: s.usage?.mem ?? 0,
        time: s.usage?.time ?? '',
      },
    },
  }));
}

/**
 * v3 → legacy adapter surface. Each entry is independent; consumers
 * import only the converters they need. Slices 2..N add their own
 * entries here as they introduce new resources.
 */
export const stToLegacy = {
  appDetail: appDetailToLegacy,
  appSummary: appDetailToLegacySummary,
  envVars: envVarsToLegacy,
  appStats: appStatsToLegacy,
};
