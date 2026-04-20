export interface CFEntityRef {
  cnsiGuid: string;
  entityGuid: string;
}

export type CFEntityId = string & { readonly __brand: 'CFEntityId' };

export function cfEntityId(ref: CFEntityRef): CFEntityId {
  if (!ref.cnsiGuid) throw new Error('cfEntityId: cnsiGuid is required');
  if (!ref.entityGuid) throw new Error('cfEntityId: entityGuid is required');
  if (ref.cnsiGuid.includes(':')) throw new Error('cfEntityId: cnsiGuid must not contain colon (reserved separator)');
  if (ref.entityGuid.includes(':')) throw new Error('cfEntityId: entityGuid must not contain colon (reserved separator)');
  return `${ref.cnsiGuid}:${ref.entityGuid}` as CFEntityId;
}

export function parseCfEntityId(value: string): CFEntityRef | null {
  const idx = value.indexOf(':');
  if (idx <= 0 || idx === value.length - 1) return null;
  return { cnsiGuid: value.slice(0, idx), entityGuid: value.slice(idx + 1) };
}

export function isComposite(value: string): boolean {
  return parseCfEntityId(value) !== null;
}
