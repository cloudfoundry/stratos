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

  // Parse JSON Pointer fragment: #/definitions/X or #/$defs/X
  const fragment = ref.startsWith('#/') ? ref.slice(2) : null;
  if (!fragment) {
    return node;
  }
  const parts = fragment.split('/');
  let resolved: any = root;
  for (const part of parts) {
    if (resolved == null || typeof resolved !== 'object') {
      return node;
    }
    resolved = resolved[part];
  }
  if (resolved == null) {
    return node;
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
