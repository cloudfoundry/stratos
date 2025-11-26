import { stratosEndpointGuidKey } from '../entity-request-pipeline/pipeline.types';

/**
 * Performs a shallow merge of state objects with type-safe value merging
 * @param state - The existing state
 * @param newState - The new state to merge in
 * @returns The merged state
 */
export const mergeState = <T extends Record<string, unknown>>(state: T, newState: T): T => {
  const baseState = { ...state } as Record<string, unknown>;

  Object.keys(newState).forEach((entityKey: string) => {
    const newValue = newState[entityKey];
    if (shouldMerge(newState, baseState as T, entityKey)) {
      const baseValue = baseState[entityKey];
      // Type guard ensures both values are Records before merging
      if (isRecord(baseValue) && isRecord(newValue)) {
        baseState[entityKey] = {
          ...baseValue,
          ...newValue
        };
      } else {
        // Fallback: Use new value if types don't match
        baseState[entityKey] = newValue;
      }
    } else {
      // No merge needed: Directly assign new value
      baseState[entityKey] = newValue;
    }
  });
  return baseState as T;
};

/**
 * Type guard to check if value is a non-null object (Record)
 * @param value - Value to check
 * @returns True if value is a Record, false otherwise
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Performs a deep merge of state objects with recursive entity merging
 * @param state - The existing state
 * @param newState - The new state to merge in
 * @returns The deeply merged state
 */
export const deepMergeState = <T extends Record<string, unknown>>(state: T, newState: T): T => {
  const baseState = { ...state } as Record<string, unknown>;
  Object.keys(newState).forEach((entityKey: string) => {
    const newValue = newState[entityKey];
    if (shouldMerge(newState, baseState as T, entityKey)) {
      const baseValue = baseState[entityKey];
      // Type guard: Ensure base value is a Record before proceeding
      if (!isRecord(baseValue) || !isRecord(newValue)) {
        baseState[entityKey] = newValue;
        return;
      }

      const baseStateEnt = { ...baseValue };
      const newStateEnt = newValue;

      // Merge each nested property
      Object.keys(newStateEnt).forEach((id: string) => {
        const baseVal = baseStateEnt[id];
        const newVal = newStateEnt[id];
        if (isRecord(baseVal) && isRecord(newVal)) {
          baseStateEnt[id] = mergeEntity(baseVal, newVal);
        } else {
          baseStateEnt[id] = newVal;
        }
      });

      // Final merge with type guard
      const baseEntityVal = baseState[entityKey];
      if (isRecord(baseEntityVal) && isRecord(baseStateEnt)) {
        baseState[entityKey] = mergeEntity(baseEntityVal, baseStateEnt);
      } else {
        baseState[entityKey] = baseStateEnt;
      }
    } else {
      baseState[entityKey] = newValue;
    }
  });
  return baseState as T;
};

/**
 * Type guard to check if an object has the normalized entity structure
 * @param obj - Object to check
 * @returns True if object has entity property that is a Record
 */
function hasEntityProperty(obj: Record<string, unknown>): obj is { entity: Record<string, unknown>; metadata?: Record<string, unknown> } {
  return 'entity' in obj && isRecord(obj.entity);
}

/**
 * Merges two entity objects with special handling for entity/metadata structure
 * @param baseEntity - The existing entity state
 * @param newEntity - The new entity data to merge
 * @returns The merged entity with proper type preservation
 */
export function mergeEntity<T extends Record<string, unknown>>(baseEntity: T, newEntity: T): T {
  // Check if this is a normalized entity with entity/metadata structure
  if (hasEntityProperty(baseEntity)) {
    // Type guard for newEntity to ensure safe access
    const next = newEntity as { entity?: unknown; metadata?: unknown };

    const merged: Record<string, unknown> = {
      // Merge entity data, using empty object if next.entity is not a valid Record
      entity: merge(baseEntity.entity, isRecord(next.entity) ? next.entity : {}),
      // Always apply the metadata regardless of whether it exists in the baseEntity or not
      // (for cases where we fetch missing inline data of an entity before the entity exists, for example fetch orgs and their spaces..
      // .. one org has over 50 spaces.. we fetch that list of spaces and apply it to a new org entity without metadata BEFORE we apply the
      // main org and mark it as fetched)
      metadata: baseEntity.metadata && isRecord(next.metadata)
        ? merge(baseEntity.metadata, next.metadata)
        : next.metadata
    };

    // Preserve endpoint GUID key if present
    const baseEntityAsRecord = baseEntity as Record<string, unknown>;
    if (baseEntityAsRecord[stratosEndpointGuidKey]) {
      merged[stratosEndpointGuidKey] = baseEntityAsRecord[stratosEndpointGuidKey];
    }

    return merged as T;
  }

  // For non-entity structures, perform simple shallow merge
  return merge(baseEntity, newEntity);
}

/**
 * Performs a shallow merge of two objects
 * @param baseObject - The base object
 * @param newObject - The new object to merge in
 * @returns The merged object
 */
function merge<T extends Record<string, unknown>>(baseObject: T, newObject: T): T {
  return {
    ...baseObject,
    ...newObject
  };
}

/**
 * Determines if two state values should be merged or replaced
 * @param newState - The new state
 * @param baseState - The base state
 * @param entityKey - The key to check
 * @returns True if values should be merged, false if replaced
 */
function shouldMerge<T extends Record<string, unknown>>(newState: T, baseState: T, entityKey: string): boolean {
  const baseValue = baseState[entityKey];
  const newValue = newState[entityKey];

  // Don't merge if new value is a string (primitive replacement)
  if (typeof newValue === 'string') {
    return false;
  }

  // Only merge if base value exists, is a Record, and has properties
  return !!baseValue &&
         isRecord(baseValue) &&
         Object.keys(baseValue).length > 0;
}

/**
 * Picks specified keys from an object with type safety
 * @param o - The source object
 * @param keys - Array of key names to pick
 * @returns A new object with only the picked keys, or null if source is falsy
 */
export const pick = <O, K extends keyof O>(o: O, keys: string[]): Pick<O, K> | null => {
  const copy: Partial<Pick<O, K>> = {};
  if (!o) {
    return null;
  }
  keys.forEach((k: string) => {
    copy[k as K] = o[k as K];
  });
  return copy as Pick<O, K>;
};

/**
 * Type definition for composable transformation functions
 */
type ComposeFn = <T>(value: T) => T;

/**
 * Composes multiple transformation functions into a single function
 * Functions are applied right-to-left (last to first in the array)
 * @param fns - Array of transformation functions to compose
 * @returns A composed function that applies all transformations
 */
export const composeFn = (...fns: ComposeFn[]): ComposeFn =>
  fns.reverse().reduce((prevFn: ComposeFn, nextFn: ComposeFn) =>
    <T>(value: T) => nextFn(prevFn(value)),
    <T>(value: T) => value
  );
