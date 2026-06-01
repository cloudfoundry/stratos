// Signal-native replacement for `validateEntityRelations()` from the
// legacy `entity-relations.ts`. Resolves all child relations declared
// in the registry for a given root + include-relations filter and
// returns a flat RelationFetchResult.
//
// Behaviour mirrors `validationLoop` -> `handleRelation`:
//   1. For each parent + child relation, check the inline path on the
//      parent. If the children are inline, short-circuit with no HTTP
//      (mirrors the legacy `pathGet(childRelation.path, entity)` branch).
//   2. Otherwise call the descriptor's fetchChildren() — this is the
//      surface that consumers wire to HTTP, an existing service signal,
//      or a denormalized payload field.
//   3. Recurse into the resolved children for grandchild relations.
//
// Caches the resolved children in a per-(cnsi, parentType, parentGuid,
// relationKey) map exposed via childSignal() so reactive consumers can
// bind without re-fetching. Concurrent fetches on the same key share a
// single in-flight Promise (epoch-token de-dup mirrors
// cnsi-entity-source.ts).

import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import {
  RelationDescriptor,
  RelationFetchContext,
  RelationFetchEntry,
  RelationFetchResult,
  signalRelationKey,
  SignalRelationNode,
  SignalRelationPostProcessor,
  SignalRelationPostProcessorContext,
  SignalRelationTree,
} from './signal-relation-types';
import {
  buildSignalRelationTree,
  indexDescriptors,
  RelationDescriptorRegistry,
} from './signal-relation-tree';
import { SignalRelationPostProcessorRegistry } from './signal-relation-post-processor';

interface FetchConfig {
  cnsiGuid: string;
  rootEntityType: string;
  parents: ReadonlyArray<{ guid: string; payload: unknown }>;
  includeRelations: ReadonlyArray<string>;
}

const childSignalKey = (cnsiGuid: string, parentType: string, parentGuid: string, relationKey: string): string =>
  `${cnsiGuid}::${parentType}::${parentGuid}::${relationKey}`;

@Injectable({ providedIn: 'root' })
export class SignalRelationFetcherService {
  private readonly descriptors: RelationDescriptor[] = [];
  private readonly childSignals = new Map<string, WritableSignal<unknown[]>>();
  private readonly inFlight = new Map<string, Promise<unknown[]>>();

  constructor(private readonly postProcessors: SignalRelationPostProcessorRegistry) {}

  /** Register a single descriptor. Idempotent on (parent, child, paramName). */
  register(descriptor: RelationDescriptor): void {
    const dupe = this.descriptors.findIndex(d =>
      d.parentEntityType === descriptor.parentEntityType &&
      d.childEntityType === descriptor.childEntityType &&
      d.paramName === descriptor.paramName,
    );
    if (dupe >= 0) {
      this.descriptors.splice(dupe, 1, descriptor);
      return;
    }
    this.descriptors.push(descriptor);
  }

  /** Bulk register; convenience for module bootstraps. */
  registerAll(descriptors: ReadonlyArray<RelationDescriptor>): void {
    descriptors.forEach(d => this.register(d));
  }

  /** Build the relation tree for the current registry snapshot. Mirrors fetchEntityTree(). */
  buildTree(rootEntityType: string, includeRelations: ReadonlyArray<string>): SignalRelationTree {
    const registry = this.snapshotRegistry();
    return buildSignalRelationTree(rootEntityType, registry, includeRelations);
  }

  /**
   * Reactive read of the children resolved for a (parent, relation) key.
   * Returns an empty signal if nothing has been fetched yet — consumers
   * can bind early and rerender once fetch() resolves.
   */
  childSignal<TChild = unknown>(
    cnsiGuid: string,
    parentEntityType: string,
    parentGuid: string,
    childEntityType: string,
  ): Signal<TChild[]> {
    const relationKey = signalRelationKey(parentEntityType, childEntityType);
    const key = childSignalKey(cnsiGuid, parentEntityType, parentGuid, relationKey);
    let s = this.childSignals.get(key);
    if (!s) {
      s = signal<unknown[]>([]);
      this.childSignals.set(key, s);
    }
    return s.asReadonly() as Signal<TChild[]>;
  }

  /**
   * Resolve all relations declared in the include filter for the given
   * parents. Mirrors `validateEntityRelations()` but returns a Promise
   * rather than emitting an action stream. After the fetch completes,
   * registered post-processors are invoked.
   */
  async fetch(config: FetchConfig): Promise<RelationFetchResult> {
    const { cnsiGuid, rootEntityType, parents, includeRelations } = config;
    const registry = this.snapshotRegistry();
    const tree = buildSignalRelationTree(rootEntityType, registry, includeRelations);

    const entries: RelationFetchEntry[] = [];
    const errors: { resource: string; message: string; detail?: unknown }[] = [];

    for (const parent of parents) {
      await this.walkParent({
        cnsiGuid,
        parentEntityType: rootEntityType,
        parent,
        nodes: tree.rootRelations,
        includeRelations,
        entries,
        errors,
      });
    }

    // Run post-processors after all fetches complete (mirrors the
    // legacy handleValidationLoopResults -> validationPostProcessor
    // call site).
    const postWrites = new Map<string, Map<string, Record<string, unknown>>>();
    const ctx: SignalRelationPostProcessorContext = {
      cnsiGuid,
      upsert: (entityType, guid, row) => {
        let byGuid = postWrites.get(entityType);
        if (!byGuid) {
          byGuid = new Map();
          postWrites.set(entityType, byGuid);
        }
        const existing = byGuid.get(guid);
        byGuid.set(guid, existing ? { ...existing, ...row } : row);
      },
    };

    const result: RelationFetchResult = {
      cnsiGuid,
      rootEntityType,
      entries,
      errors,
    };

    const processors: SignalRelationPostProcessor[] = this.postProcessors.forRoot(rootEntityType);
    const parentPayloads = parents.map(p => p.payload);
    for (const processor of processors) {
      try {
        processor.run(parentPayloads, result, ctx);
      } catch (err) {
        errors.push({
          resource: `post-processor:${rootEntityType}`,
          message: err instanceof Error ? err.message : String(err),
          detail: err,
        });
      }
    }

    return result;
  }

  /** Test-only: clear the cached child signals + in-flight map. */
  _resetForTests(): void {
    this.childSignals.clear();
    this.inFlight.clear();
  }

  /**
   * Snapshot the current descriptor set as a parent→children registry.
   * Public so the entity-delete chokepoint can derive invalidation closures
   * (affectedSlices) from the same descriptors that drive fetch.
   */
  snapshotRegistry(): RelationDescriptorRegistry {
    return indexDescriptors(this.descriptors);
  }

  private async walkParent(args: {
    cnsiGuid: string;
    parentEntityType: string;
    parent: { guid: string; payload: unknown };
    nodes: SignalRelationNode[];
    includeRelations: ReadonlyArray<string>;
    entries: RelationFetchEntry[];
    errors: { resource: string; message: string; detail?: unknown }[];
  }): Promise<void> {
    const { cnsiGuid, parentEntityType, parent, nodes, includeRelations, entries, errors } = args;

    for (const node of nodes) {
      const inline = node.descriptor.inlineParentPath
        ? this.readInlinePath(parent.payload, node.descriptor.inlineParentPath)
        : undefined;

      let children: unknown[];
      let fromInline = false;
      const entryErrors: { resource: string; message: string; detail?: unknown }[] = [];

      if (inline !== undefined && inline !== null) {
        children = node.isArray ? (Array.isArray(inline) ? inline : [inline]) : [inline];
        fromInline = true;
      } else {
        try {
          children = await this.fetchWithDedup(
            cnsiGuid,
            parentEntityType,
            parent,
            node,
            includeRelations,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const errorEntry = {
            resource: `${parentEntityType}->${node.childEntityType}:${parent.guid}`,
            message: msg,
            detail: err,
          };
          entryErrors.push(errorEntry);
          errors.push(errorEntry);
          children = [];
        }
      }

      // Surface the resolved set on the per-(parent, relation) signal so
      // reactive consumers update without re-running the fetch.
      const key = childSignalKey(cnsiGuid, parentEntityType, parent.guid, node.relationKey);
      let sig = this.childSignals.get(key);
      if (!sig) {
        sig = signal<unknown[]>([]);
        this.childSignals.set(key, sig);
      }
      sig.set(children);

      entries.push({
        parentEntityType,
        childEntityType: node.childEntityType,
        parentGuid: parent.guid,
        paramName: node.paramName,
        isArray: node.isArray,
        children,
        fromInline,
        errors: entryErrors,
      });

      if (node.childRelations.length && children.length) {
        for (const child of children) {
          const childGuid = this.extractGuid(child);
          if (!childGuid) {
            continue;
          }
          await this.walkParent({
            cnsiGuid,
            parentEntityType: node.childEntityType,
            parent: { guid: childGuid, payload: child },
            nodes: node.childRelations,
            includeRelations,
            entries,
            errors,
          });
        }
      }
    }
  }

  private async fetchWithDedup(
    cnsiGuid: string,
    parentEntityType: string,
    parent: { guid: string; payload: unknown },
    node: SignalRelationNode,
    includeRelations: ReadonlyArray<string>,
  ): Promise<unknown[]> {
    const key = childSignalKey(cnsiGuid, parentEntityType, parent.guid, node.relationKey);
    const inflight = this.inFlight.get(key);
    if (inflight) {
      return inflight;
    }
    const ctx: RelationFetchContext = {
      cnsiGuid,
      parentGuid: parent.guid,
      remainingIncludeRelations: includeRelations.filter(r => r !== node.relationKey),
    };
    const promise = (async () => {
      try {
        const rows = await node.descriptor.fetchChildren(parent.payload, ctx);
        return rows ?? [];
      } finally {
        this.inFlight.delete(key);
      }
    })();
    this.inFlight.set(key, promise);
    return promise;
  }

  private readInlinePath(payload: unknown, path: string): unknown {
    if (payload == null || !path) {
      return undefined;
    }
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== 'object') {
        return undefined;
      }
      return (acc as Record<string, unknown>)[key];
    }, payload);
  }

  private extractGuid(child: unknown): string | undefined {
    if (!child || typeof child !== 'object') {
      return undefined;
    }
    const obj = child as Record<string, unknown>;
    if (typeof obj.guid === 'string') {
      return obj.guid;
    }
    const metadata = obj.metadata as { guid?: string } | undefined;
    return metadata?.guid;
  }
}
