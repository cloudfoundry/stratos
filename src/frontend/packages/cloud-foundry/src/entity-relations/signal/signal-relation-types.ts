// Signal-native entity-relations substrate types (wave-3 CF-foundation).
//
// This file is the type spine for the replacement of the legacy ngrx
// entity-relations pipeline (see `entity-relations.types.ts`,
// `entity-relations.tree.ts`, `entity-relations.ts`). It introduces:
//
//   - RelationDescriptor: a declarative parent->child relationship that
//     consumers register up front. Replaces the implicit walk over
//     EntitySchema.schema.entity[*].
//   - SignalRelationTree: the pure data shape returned by
//     buildSignalRelationTree() — depth + ordered relation keys + per-node
//     descriptors. Mirrors EntityTree (rootRelation/maxDepth/requiredParamNames)
//     in shape so the include-relations query-param computation translates
//     1:1.
//   - RelationFetchResult: aggregate result of a fetcher run. Each entry
//     carries the parent guid, the child rows actually realized, and any
//     errors collected per-relation.
//   - SignalRelationPostProcessor: registry hook called after a fetch
//     completes. Mirrors validationPostProcessor() in the legacy pipeline
//     but takes pure context rather than dispatching ngrx actions.
//
// Consumers (cloud-foundry list configs / data services) flip from
// dispatching FetchRelationPaginatedAction / FetchRelationSingleAction
// to calling SignalRelationFetcherService.fetch(...) which returns a
// Promise that resolves once all child fetches and post-processors have
// run. Legacy pipeline files are NOT touched in this slice — consumer
// migration happens in wave β.

/**
 * Compose the relation key used to look up registered descriptors and to
 * build CAPI `include-relations` query params. Mirrors the legacy
 * `createEntityRelationKey(parent, child)` shape (parent-child, hyphen
 * separator) so the wire-side string survives the migration unchanged.
 */
export const signalRelationKey = (parentEntityType: string, childEntityType: string): string =>
  `${parentEntityType}-${childEntityType}`;

/**
 * Context passed into a descriptor's fetchChildren() implementation. The
 * fetcher can either return rows directly (for batch/inlined cases) or
 * issue HTTP via the cnsi guid + parent guid hint.
 */
export interface RelationFetchContext {
  cnsiGuid: string;
  parentGuid: string;
  /** The relation keys still wanted at this level (so descriptors can pass them through to backend `include-relations`). */
  remainingIncludeRelations: string[];
}

/**
 * Descriptor declaring how to materialize a child collection (or single
 * child) for a given parent type. Registered up front via
 * SignalRelationFetcherService.register(); the fetcher tree walk (built
 * by buildSignalRelationTree) traverses descriptors transitively for
 * nested relations.
 *
 * `fetchChildren` returns the realized child rows. Implementations may
 * fetch from HTTP, an existing service signal, or a denormalized
 * payload field on the parent — the substrate is agnostic.
 */
export interface RelationDescriptor<TParent = unknown, TChild = unknown> {
  /** Parent entity type, matches EntitySchema.entityType ("organization", "space", ...). */
  parentEntityType: string;
  /** Child entity type ("space", "route", ...). */
  childEntityType: string;
  /**
   * Field name on the parent payload where the child collection is
   * stored once denormalized ("spaces", "managers", ...). Used for
   * mirror writes by post-processors and to populate parent.entity[paramName]
   * after a fetch.
   */
  paramName: string;
  /** True when the relation is one-to-many (collection of child guids). */
  isArray: boolean;
  /**
   * Optional dotted path inside the parent payload where the child
   * collection may already exist inline (for example `entity.spaces`).
   * If present and populated the fetcher short-circuits without HTTP —
   * mirrors the legacy `pathGet(childRelation.path, entity)` shortcut.
   */
  inlineParentPath?: string;
  /** Async fetcher for the missing-children case. */
  fetchChildren: (parent: TParent, ctx: RelationFetchContext) => Promise<TChild[]>;
}

/**
 * One node in the resolved relation tree. Mirrors EntityTreeRelation.
 * Children are filtered by the caller's includeRelations list and only
 * descriptors that exist in the registry are included.
 */
export interface SignalRelationNode {
  parentEntityType: string;
  childEntityType: string;
  paramName: string;
  isArray: boolean;
  /** Cached relation key (same composition as signalRelationKey()). */
  relationKey: string;
  descriptor: RelationDescriptor;
  childRelations: SignalRelationNode[];
}

/**
 * Tree returned by buildSignalRelationTree(). Mirrors EntityTree but is
 * a plain interface (no class) — easier to spread / clone, and there is
 * no behaviour beyond data.
 */
export interface SignalRelationTree {
  rootEntityType: string;
  maxDepth: number;
  /**
   * Ordered de-duplicated paramNames discovered while walking the tree.
   * Mirrors EntityTree.requiredParamNames; consumers feed this into the
   * outbound `include-relations` query param.
   */
  requiredParamNames: string[];
  /**
   * Ordered de-duplicated relation keys discovered while walking. Used
   * as the cache key for fetcher results and for include-relations param
   * composition (consumers can pick whichever they need).
   */
  relationKeys: string[];
  rootRelations: SignalRelationNode[];
}

/**
 * One per-parent fetch outcome. Errors are collected (not thrown) so a
 * partial population can still complete; consumers inspect `errors` to
 * surface them.
 */
export interface RelationFetchEntry<TChild = unknown> {
  parentEntityType: string;
  childEntityType: string;
  parentGuid: string;
  paramName: string;
  isArray: boolean;
  children: TChild[];
  /** True when the children were resolved from an inline path on the parent (no HTTP). */
  fromInline: boolean;
  errors: { resource: string; message: string; detail?: unknown }[];
}

export interface RelationFetchResult {
  cnsiGuid: string;
  rootEntityType: string;
  /** Flattened entries across all (parent, descriptor) pairs visited. */
  entries: RelationFetchEntry[];
  /** Errors collected across the run; same items as entries[*].errors flattened. */
  errors: { resource: string; message: string; detail?: unknown }[];
}

/**
 * Mutation surface available to a post-processor. `upsert` writes
 * additional rows for an entity type (the role-mirror processor uses
 * this to push role flags onto user rows fetched alongside an org/space).
 */
export interface SignalRelationPostProcessorContext {
  cnsiGuid: string;
  /**
   * Push or merge rows for an arbitrary entity type. The substrate keeps
   * a per-run scratchpad keyed by (entityType -> guid -> row) and
   * exposes the merged map via RelationFetchResult.postProcessorWrites
   * once all processors have run (callers can apply those to their own
   * service signals).
   */
  upsert: (entityType: string, guid: string, row: Record<string, unknown>) => void;
}

/**
 * Post-processor invoked after a fetch completes for the root entity
 * type. Mirrors `validationPostProcessor` in the legacy pipeline but
 * receives pure data + a write context rather than dispatching ngrx.
 */
export interface SignalRelationPostProcessor {
  /** Triggers when the root entity type matches. */
  rootEntityType: string;
  run: (
    parents: ReadonlyArray<unknown>,
    fetched: RelationFetchResult,
    ctx: SignalRelationPostProcessorContext,
  ) => void;
}
