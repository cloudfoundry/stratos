import { MultiActionListEntity } from '@stratosui/store';

/**
 * Unwrap a `MultiActionListEntity` to its underlying entity, or pass a plain
 * entity through unchanged. Lifted out of the legacy list framework's
 * local-filtering-sorting helpers (the only surviving consumer is
 * `cloud-foundry` cf.helpers).
 */
export function extractActualListEntity(entity: any | MultiActionListEntity) {
  if (entity instanceof MultiActionListEntity) {
    return entity.entity;
  }
  return entity;
}
