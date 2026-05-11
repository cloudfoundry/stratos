// Public facade for the signal-native entity-relations substrate. Mirrors
// the legacy `entity-relations.ts` exports (`validateEntityRelations`,
// `populatePaginationFromParent`, `listEntityRelations`) so consumer
// migrations in wave β are a near-mechanical name swap.
//
// All three legacy entry points are reframed:
//
//   validateEntityRelations(config) -> validateRelationsForSignals(...)
//     Now async; takes parents + cnsiGuid + includeRelations directly,
//     returns Promise<RelationFetchResult>. No store/ngrx involvement.
//
//   populatePaginationFromParent(store, action) -> populateChildrenFromParent(...)
//     Reads the inline path on a single parent payload via the registered
//     descriptor and returns the resolved children synchronously when
//     present. Mirrors the short-circuit branch of populatePaginationFromParent.
//
//   listEntityRelations(action) -> listSignalRelations(rootType, registry, includes)
//     Returns { maxDepth, relations } — the same shape consumed by
//     `addCfRelationParams` to build CAPI `inline-relations-depth` and
//     `include-relations` query params. Wave β can hand the same object
//     to that helper unchanged.

import {
  RelationDescriptor,
  RelationFetchResult,
  signalRelationKey,
  SignalRelationTree,
} from './signal-relation-types';
import {
  buildSignalRelationTree,
  RelationDescriptorRegistry,
} from './signal-relation-tree';
import { SignalRelationFetcherService } from './signal-relation-fetcher.service';

export interface ValidateRelationsForSignalsConfig {
  fetcher: SignalRelationFetcherService;
  cnsiGuid: string;
  rootEntityType: string;
  parents: ReadonlyArray<{ guid: string; payload: unknown }>;
  includeRelations: ReadonlyArray<string>;
}

/** Async fetch of all declared relations under a root + include-relations filter. */
export function validateRelationsForSignals(config: ValidateRelationsForSignalsConfig): Promise<RelationFetchResult> {
  const { fetcher, cnsiGuid, rootEntityType, parents, includeRelations } = config;
  return fetcher.fetch({ cnsiGuid, rootEntityType, parents, includeRelations });
}

/**
 * Synchronously read children declared by `descriptor.inlineParentPath`
 * out of a parent payload. Returns the children array (or null if the
 * inline path is missing). Useful when a consumer already has the
 * denormalized parent in a service signal and wants to avoid an HTTP
 * round-trip — mirrors the populate-from-parent shortcut in the legacy
 * pipeline.
 */
export function populateChildrenFromParent(
  parentPayload: unknown,
  descriptor: RelationDescriptor,
): unknown[] | null {
  if (!descriptor.inlineParentPath || parentPayload == null) {
    return null;
  }
  const value = descriptor.inlineParentPath.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, parentPayload);
  if (value === undefined || value === null) {
    return null;
  }
  if (descriptor.isArray) {
    return Array.isArray(value) ? value : [value];
  }
  return [value];
}

/**
 * Equivalent of legacy `listEntityRelations(action)` — returns the
 * { maxDepth, relations } pair `addCfRelationParams` expects to build
 * outbound CAPI query params. Cap at depth 2 happens in the param
 * helper, not here, to match legacy behaviour.
 */
export function listSignalRelations(
  rootEntityType: string,
  registry: RelationDescriptorRegistry,
  includeRelations: ReadonlyArray<string> = [],
): { maxDepth: number; relations: string[] } {
  const tree: SignalRelationTree = buildSignalRelationTree(rootEntityType, registry, includeRelations);
  return {
    maxDepth: tree.maxDepth,
    relations: tree.requiredParamNames,
  };
}

export { signalRelationKey };
