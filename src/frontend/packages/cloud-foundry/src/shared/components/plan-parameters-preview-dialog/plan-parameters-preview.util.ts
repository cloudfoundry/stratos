import type { StServicePlan } from '../../../services/endpoint-data/stratos-types';

/**
 * Pull the create-instance parameter JSON Schema off a details-tier plan.
 * `schemas` only ships at `?return=details`, so a summary-tier plan returns
 * null here (the dialog fetches the details tier before calling this).
 */
export function extractCreateParameters(plan: StServicePlan | null | undefined): object | null {
  const params = plan?.schemas?.serviceInstance?.create?.parameters;
  return params && typeof params === 'object' ? params as object : null;
}

/**
 * Clean a raw parameter schema for the read-only json-viewer tree, returning
 * null when there's nothing worth showing. Drops `$schema` plumbing (matches
 * schema-form's filterSchema) and treats an otherwise-empty object as "no
 * configurable parameters".
 *
 * simplification: strips only top-level `$schema` and gates on key-count. If live
 * verify shows nested noise (`additionalProperties: false`, bare `type:object`
 * with no `properties`), extend the strip/gate here rather than per-caller.
 */
export function previewSchema(raw: object | null | undefined): object | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const cleaned = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(([k]) => k !== '$schema'),
  );
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}
