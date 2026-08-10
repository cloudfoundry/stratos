/**
 * The detail (named) foundation export (GH #5702) — the same drains the
 * anonymous export (#5703) projects, with identity kept: org, space and app
 * names and GUIDs, quota links, measured roles and service bindings.
 *
 * Two things this file owns that the tree builder does not:
 *
 *  - `drains`: when each contributing pass last ran, so a reader can tell a
 *    fresh file from a stale one without trusting `collected_at` alone;
 *  - `truncated`: the datasets that are known page-capped. The services drain
 *    takes page 1 only, so a big foundation's instances and bindings are a
 *    prefix, not the set. Naming them is the difference between an incomplete
 *    file and a misleading one.
 */
import { buildDetailTree, DetailOrphans, DetailOrg, DetailTreeInput } from './detail-shape';
import { buildTotals, ShapeDrains, SessionTotals } from './shape-export';
import { MeasuredTotals } from './shape-measure.service';

export const DETAIL_COVERAGE_NOTE =
  "This export names the resources visible to the collecting user on this endpoint; it makes no completeness claim.";

/** The services drain's per-page ceiling (endpoint-data.service.ts detailPerPage). */
export const SERVICES_PAGE_CAP = 500;

export interface DetailExportInput {
  endpoint: { guid: string; name: string };
  entities: DetailTreeInput;
  sessionTotals: SessionTotals;
  drains: ShapeDrains;
  /** Drain name → when it last ran; null for one that has not. */
  drainStamps: Record<string, Date | null>;
  collectedAt: Date;
  measuredTotals?: MeasuredTotals;
  /** When the roles measure ran — its absence is why `roles` keys are missing. */
  rolesFetchedAt?: Date;
}

export interface DetailExport {
  schema_version: 1;
  mode: 'detail';
  endpoint: { guid: string; name: string };
  collected_at: string;
  coverage_note: string;
  /** Drain name → ISO timestamp; null = never ran this session. */
  drains: Record<string, string | null>;
  /** Datasets present here as a page-capped prefix rather than the whole set. */
  truncated?: string[];
  totals: Record<string, number>;
  organizations: DetailOrg[];
  orphans: DetailOrphans;
}

/**
 * Names the page-capped datasets. Instances have a count to compare against;
 * bindings have none, so a full page is the only signal available — it reads
 * as truncated, which errs toward warning rather than silence.
 */
const truncatedSets = (input: DetailExportInput): string[] => {
  const { entities, sessionTotals } = input;
  const truncated: string[] = [];
  if (entities.serviceInstances && entities.serviceInstances.length < sessionTotals.serviceInstances) {
    truncated.push('service_instances');
  }
  if (entities.bindings && entities.bindings.length >= SERVICES_PAGE_CAP) {
    truncated.push('service_bindings');
  }
  return truncated;
};

export const buildDetailExport = (input: DetailExportInput): DetailExport => {
  const truncated = truncatedSets(input);
  const drains: Record<string, string | null> = {};
  for (const [name, fetchedAt] of Object.entries(input.drainStamps)) {
    drains[name] = fetchedAt ? fetchedAt.toISOString() : null;
  }
  if (input.rolesFetchedAt) {
    drains['roles'] = input.rolesFetchedAt.toISOString();
  }

  const { organizations, orphans } = buildDetailTree(input.entities);

  return {
    schema_version: 1,
    mode: 'detail',
    endpoint: input.endpoint,
    collected_at: input.collectedAt.toISOString(),
    coverage_note: DETAIL_COVERAGE_NOTE,
    drains,
    ...(truncated.length && { truncated }),
    totals: buildTotals(input.sessionTotals, input.drains, input.measuredTotals),
    organizations,
    orphans,
  };
};
