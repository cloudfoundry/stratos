import { JsonSchema, NodeKind, ResolvedNode } from './schema-node.model';

export function resolveRef(node: JsonSchema, root: JsonSchema, seen: Set<string> = new Set()): JsonSchema {
  if (!node.$ref) {
    return node;
  }
  const ref: string = node.$ref;
  if (seen.has(ref)) {
    return {};
  }
  seen.add(ref);

  // Strip $ref from the node on any unresolvable/non-fragment ref so a caller
  // can't re-resolve the returned node back into a loop.
  const { $ref, ...rest } = node;

  // Parse JSON Pointer fragment: #/definitions/X or #/$defs/X
  const fragment = ref.startsWith('#/') ? ref.slice(2) : null;
  if (!fragment) {
    return rest;
  }
  const parts = fragment.split('/');
  let resolved: any = root;
  for (const part of parts) {
    if (resolved == null || typeof resolved !== 'object') {
      return rest;
    }
    resolved = resolved[part];
  }
  if (resolved == null) {
    return rest;
  }
  // Recursively resolve if the target also has a $ref
  return resolveRef(resolved, root, seen);
}

export function mergeAllOf(node: JsonSchema, root: JsonSchema): JsonSchema {
  if (!node.allOf || !Array.isArray(node.allOf)) {
    return node;
  }

  const merged: JsonSchema = { ...node };
  delete merged.allOf;

  const allMembers: JsonSchema[] = node.allOf.map((member: JsonSchema) => resolveRef(member, root));

  // Union properties
  const properties: Record<string, JsonSchema> = { ...(node.properties ?? {}) };
  // Concat+dedupe required
  const requiredSet = new Set<string>(node.required ?? []);

  for (const member of allMembers) {
    if (member.properties) {
      Object.assign(properties, member.properties);
    }
    if (Array.isArray(member.required)) {
      for (const r of member.required) {
        requiredSet.add(r);
      }
    }
  }

  if (Object.keys(properties).length > 0) {
    merged.properties = properties;
  }
  if (requiredSet.size > 0) {
    merged.required = Array.from(requiredSet);
  }

  return merged;
}

export function classifyNode(node: JsonSchema, root: JsonSchema): ResolvedNode {
  // Step 1: resolve $ref
  let resolved = resolveRef(node, root);
  // Step 2: merge allOf
  resolved = mergeAllOf(resolved, root);

  const kind = pickKind(resolved);

  return {
    kind,
    schema: resolved,
    title: resolved.title,
    description: resolved.description,
    required: resolved.required,
  };
}

/**
 * Build a display skeleton for a schema: every property present, each value an
 * UNSET placeholder (`''` for string/enum, `null` for number/boolean/composition,
 * `[]` for arrays, nested skeleton for objects). Lets the JSON view show the
 * available parameter keys when nothing is filled in yet. Values are deliberately
 * "empty" so `stripEmpty` removes an untouched skeleton down to `{}` on submit.
 */
export function schemaToSkeleton(schema: JsonSchema, root: JsonSchema = schema, seen: Set<JsonSchema> = new Set()): unknown {
  const node = classifyNode(schema, root);
  // NOTE: guard self-referential $ref schemas (recursive defs) — emit null rather than recurse forever.
  if (seen.has(node.schema)) {
    return null;
  }
  seen.add(node.schema);

  switch (node.kind) {
    case 'object': {
      const props: Record<string, JsonSchema> = node.schema.properties ?? {};
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(props)) {
        out[key] = schemaToSkeleton(props[key], root, new Set(seen));
      }
      return out;
    }
    case 'string':
    case 'enum':
      return '';
    case 'array':
    case 'tuple':
    case 'multiselect':
      return [];
    case 'map':
      return {};
    // number / boolean / null / oneOf / anyOf / unknown: leave unset
    default:
      return null;
  }
}

/**
 * Overlay the user's current `data` onto a full schema `skeleton` so the JSON view
 * always shows every field: set values appear filled in, untouched ones keep their
 * empty placeholder. Set scalars (including `false`/`0`) win over the placeholder;
 * absent keys keep the skeleton's. Extra keys in `data` (map/additionalProperties)
 * are preserved. Combined with `stripEmpty` on submit, an untouched field shows in
 * the editor but is not sent.
 */
export function mergeSkeleton(skeleton: unknown, data: unknown): unknown {
  if (data === undefined || data === null) {
    return skeleton;
  }
  if (Array.isArray(skeleton)) {
    return Array.isArray(data) && data.length ? data : skeleton;
  }
  if (skeleton !== null && typeof skeleton === 'object') {
    if (typeof data !== 'object' || Array.isArray(data)) {
      return skeleton;   // type mismatch — keep the structural skeleton
    }
    const sk = skeleton as Record<string, unknown>;
    const dt = data as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(sk)) {
      out[k] = k in dt ? mergeSkeleton(sk[k], dt[k]) : sk[k];
    }
    for (const k of Object.keys(dt)) {
      if (!(k in out)) { out[k] = dt[k]; }   // preserve map / additionalProperties keys
    }
    return out;
  }
  // scalar placeholder — the user's value (incl. false / 0) replaces it
  return data;
}

/**
 * Recursively drop "unset" values — `null`, `undefined`, `''`, empty arrays, and
 * objects that become empty after cleaning — while KEEPING meaningful falsy values
 * (`false`, `0`). Used so the params actually submitted contain only what the user
 * set: an untouched JSON skeleton collapses to `undefined` (→ no params).
 * simplification: empty strings are treated as unset and dropped; a broker needing a
 * literal "" param isn't supported here — out of scope for the schema editor.
 */
export function stripEmpty(value: unknown): unknown {
  if (Array.isArray(value)) {
    const arr = value.map(stripEmpty).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = stripEmpty(v);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (value === null || value === '') {
    return undefined;
  }
  return value;
}

function pickKind(schema: JsonSchema): NodeKind {
  // Precedence: oneOf → anyOf → map → object → tuple/multiselect/array → enum → string → number/integer → boolean → null → unknown
  if (schema.oneOf) {
    return 'oneOf';
  }
  if (schema.anyOf) {
    return 'anyOf';
  }

  const type = schema.type;

  if (type === 'object' || (schema.properties && !type)) {
    // object with additionalProperties and no properties = map
    if (schema.additionalProperties !== undefined && !schema.properties) {
      return 'map';
    }
    return 'object';
  }

  if (type === 'array') {
    const items = schema.items;
    if (Array.isArray(items)) {
      return 'tuple';
    }
    // uniqueItems gates multiselect: no-duplicates => fixed checkbox group.
    // An enum array WITHOUT uniqueItems is a repeatable dropdown => array.
    if (items && items.enum && schema.uniqueItems) {
      return 'multiselect';
    }
    return 'array';
  }

  if (schema.enum) {
    return 'enum';
  }

  if (type === 'string') {
    return 'string';
  }
  if (type === 'number' || type === 'integer') {
    return 'number';
  }
  if (type === 'boolean') {
    return 'boolean';
  }
  if (type === 'null') {
    return 'null';
  }

  return 'unknown';
}
