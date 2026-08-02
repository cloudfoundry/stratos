/**
 * The per-endpoint section model the Foundational Shape page renders, and its
 * projection to the schema_version 1 export — shared by the page's export
 * actions and the comparison card's live-section slots.
 */
import { SessionShape } from './session-shape';
import { AgnosticExport, buildAgnosticExport } from './shape-export';
import { MeasuredEcosystem, MeasuredTotals } from './shape-measure.service';

export interface DrainStamp {
  fetchedAt: Date | null;
  stale: boolean;
}

export interface ShapeSection {
  guid: string;
  name: string;
  shape: SessionShape;
  totals: {
    orgs: number;
    /** null = spaces drain never ran this session (distinct from an empty foundation). */
    spaces: number | null;
    apps: number;
    routes: number;
    serviceInstances: number;
    serviceOfferings: number;
    servicePlans: number;
    serviceBrokers: number;
  };
  drains: { orgs: DrainStamp; spaces: DrainStamp; apps: DrainStamp };
  loading: boolean;
  /** At least one full drain landed, so the shape cards mean something. */
  hasDrains: boolean;
  /** The fast counts pass has run, so the totals row is real data. */
  countsLoaded: boolean;
  /** The services counts pass (a later, separate fetch) has run. */
  servicesCountsLoaded: boolean;
  /** The connected user is a CF admin on this endpoint — gates export. */
  admin: boolean;
}

/** The anonymous projection (#5703) of everything a section has measured, stamped now. */
export const sectionExportPayload = (
  section: ShapeSection,
  measuredTotals?: MeasuredTotals,
  measuredEcosystem?: MeasuredEcosystem
): AgnosticExport =>
  buildAgnosticExport({
    shape: section.shape,
    sessionTotals: section.totals,
    drains: {
      counts: section.countsLoaded,
      servicesCounts: section.servicesCountsLoaded,
      orgs: section.drains.orgs.fetchedAt !== null,
      spaces: section.drains.spaces.fetchedAt !== null,
      apps: section.drains.apps.fetchedAt !== null,
    },
    collectedAt: new Date(),
    measuredTotals,
    measuredEcosystem,
  });
