/**
 * The anonymous foundation shape export (GH #5703): a pure projection of the
 * shape the page has measured, in the schema_version 1 format the reference
 * collector established. Identity is stripped by construction — nothing named
 * enters the export except ecosystem vocabulary (stack and buildpack names).
 *
 * Honesty rules: a key is present only when its data was actually measured
 * this session (never-loaded ≠ empty — a drained-but-empty distribution
 * exports as null, an un-run drain exports as nothing), and every export
 * carries the standing coverage note because completeness cannot be
 * determined from the data itself.
 */
import { SessionShape } from './session-shape';
import { Distribution, TopShare } from './shape-stats';
import { MeasuredEcosystem, MeasuredTotals } from './shape-measure.service';

export const COVERAGE_NOTE =
  "This export reflects the collecting user's visibility on this endpoint; it makes no completeness claim.";

/** Which data sources have actually run this session. */
export interface ShapeDrains {
  /** The fast ?return=counts pass (orgs/apps/routes + service counts). */
  counts: boolean;
  orgs: boolean;
  spaces: boolean;
  apps: boolean;
}

export interface SessionTotals {
  orgs: number;
  spaces: number | null;
  apps: number;
  routes: number;
  serviceInstances: number;
  serviceOfferings: number;
  servicePlans: number;
  serviceBrokers: number;
}

export interface AgnosticExportInput {
  shape: SessionShape;
  sessionTotals: SessionTotals;
  drains: ShapeDrains;
  collectedAt: Date;
  measuredTotals?: MeasuredTotals;
  measuredEcosystem?: MeasuredEcosystem;
}

export interface AgnosticExport {
  schema_version: 1;
  foundation_label: string;
  collected_at: string;
  coverage_note: string;
  totals: Record<string, number>;
  distributions: {
    spaces_per_org?: Distribution | null;
    apps_per_space?: Distribution | null;
    apps_per_org?: Distribution | null;
    routes_per_app?: Distribution | null;
    top_share: {
      spaces_in_largest_org?: TopShare | null;
      apps_in_largest_space?: TopShare | null;
      apps_in_largest_org?: TopShare | null;
    };
  };
  composition: {
    app_state?: Record<string, number>;
    stacks_pinned_by_apps?: Record<string, number>;
    web_process_memory_mb?: Distribution | null;
    web_process_disk_mb?: Distribution | null;
    web_process_instances?: Distribution | null;
    stacks_defined?: string[];
    buildpacks_defined?: string[];
  };
}

export const buildAgnosticExport = (input: AgnosticExportInput): AgnosticExport => {
  const { shape, sessionTotals, drains, collectedAt, measuredTotals, measuredEcosystem } = input;

  const totals: Record<string, number> = {};
  if (drains.counts) {
    totals['organizations'] = sessionTotals.orgs;
    totals['apps'] = sessionTotals.apps;
    totals['routes'] = sessionTotals.routes;
    // Combined managed + user-provided: the session count cannot split them.
    totals['service_instances'] = sessionTotals.serviceInstances;
    totals['service_offerings'] = sessionTotals.serviceOfferings;
    totals['service_plans'] = sessionTotals.servicePlans;
    totals['service_brokers'] = sessionTotals.serviceBrokers;
  }
  if (sessionTotals.spaces !== null) {
    totals['spaces'] = sessionTotals.spaces;
  }
  for (const [key, count] of Object.entries(measuredTotals?.counts ?? {})) {
    if (count !== null) {
      totals[key] = count;
    }
  }

  const distributions: AgnosticExport['distributions'] = { top_share: {} };
  const d = shape.distributions;
  if (drains.orgs && drains.spaces) {
    distributions.spaces_per_org = d.spaces_per_org;
    distributions.top_share.spaces_in_largest_org = d.top_share.spaces_in_largest_org;
  }
  if (drains.spaces && drains.apps) {
    distributions.apps_per_space = d.apps_per_space;
    distributions.top_share.apps_in_largest_space = d.top_share.apps_in_largest_space;
  }
  if (drains.orgs && drains.apps) {
    distributions.apps_per_org = d.apps_per_org;
    distributions.top_share.apps_in_largest_org = d.top_share.apps_in_largest_org;
  }
  if (drains.apps) {
    distributions.routes_per_app = d.routes_per_app;
  }

  const composition: AgnosticExport['composition'] = {};
  if (drains.apps) {
    composition.app_state = shape.composition.app_state;
    composition.stacks_pinned_by_apps = shape.composition.stacks_pinned_by_apps;
    composition.web_process_memory_mb = shape.composition.web_process_memory_mb;
    composition.web_process_disk_mb = shape.composition.web_process_disk_mb;
    composition.web_process_instances = shape.composition.web_process_instances;
  }
  if (measuredEcosystem) {
    composition.stacks_defined = measuredEcosystem.stacksDefined;
    composition.buildpacks_defined = measuredEcosystem.buildpacksDefined;
  }

  return {
    schema_version: 1,
    foundation_label: '',
    collected_at: collectedAt.toISOString(),
    coverage_note: COVERAGE_NOTE,
    totals,
    distributions,
    composition,
  };
};

const isDist = (value: unknown): value is Distribution =>
  !!value && typeof value === 'object' && 'hist' in (value as object);

export const exportMarkdown = (exported: AgnosticExport): string => {
  const lines: string[] = [
    '## Foundation shape (anonymous export)',
    '',
    `Collected: ${exported.collected_at}`,
    '',
    '| Entity | count |',
    '|---|---|',
  ];
  for (const [key, value] of Object.entries(exported.totals)) {
    lines.push(`| ${key} | ${value} |`);
  }

  const distRows: [string, Distribution][] = [];
  for (const [key, value] of Object.entries(exported.distributions)) {
    if (isDist(value)) {
      distRows.push([key, value]);
    }
  }
  for (const [key, value] of Object.entries(exported.composition)) {
    if (isDist(value)) {
      distRows.push([key, value]);
    }
  }
  if (distRows.length) {
    lines.push('', '| metric | min | median | p90 | p99 | max | mean | zeros | n |', '|---|---|---|---|---|---|---|---|---|');
    for (const [key, dist] of distRows) {
      lines.push(
        `| ${key} | ${dist.min} | ${dist.median} | ${dist.p90} | ${dist.p99} | ${dist.max} | ${dist.mean} | ${dist.zeros} | ${dist.n} |`
      );
    }
  }

  const shares = Object.entries(exported.distributions.top_share).filter(([, share]) => !!share);
  if (shares.length) {
    lines.push('');
    for (const [key, share] of shares) {
      lines.push(`- ${key}: largest holds ${(share as TopShare).largest_holds} (${((share as TopShare).fraction * 100).toFixed(1)}%)`);
    }
  }

  lines.push('', `_${exported.coverage_note}_`);
  return lines.join('\n');
};
