export type JsonSchema = Record<string, any>;

export type NodeKind =
  | 'object'
  | 'map'
  | 'array'
  | 'tuple'
  | 'multiselect'
  | 'enum'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'oneOf'
  | 'anyOf'
  | 'unknown';

export interface ResolvedNode {
  kind: NodeKind;
  schema: JsonSchema;
  title?: string;
  description?: string;
  required?: string[];
}
