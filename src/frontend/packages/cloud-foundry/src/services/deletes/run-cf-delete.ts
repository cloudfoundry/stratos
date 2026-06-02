import type { HttpClient } from '@angular/common/http';
import type { EntityDeleteController } from './entity-delete.controller';

/**
 * Shared helper that routes a CF entity delete through the
 * EntityDeleteController chokepoint. Builds the DeleteRequest (a CF v3
 * DELETE with `observe: 'response'` so writeWithJob can read the 202 + job
 * URL), awaits the terminal lifecycle event, and throws on a non-success
 * terminal (failure or blocked) so the calling component's catch can surface
 * a snackbar — for blocked, the stored CF error (e.g. association_not_empty)
 * carries through.
 *
 * Every per-entity signal-config `deleteX` is a thin call to this so the
 * delete-and-invalidate path has exactly one implementation.
 */
export async function runCfDelete(
  controller: EntityDeleteController,
  http: HttpClient,
  req: {
    cnsiGuid: string;
    entityKind: string;
    deleteGuid: string;
    deleteName?: string;
    /** Endpoint display name for the event stream; falls back to the guid. */
    cnsiName?: string;
    /** The CF v3 DELETE path, e.g. `/pp/v1/cf/spaces/{cnsi}/{guid}`. */
    path: string;
  },
): Promise<void> {
  const deleteName = req.deleteName ?? req.deleteGuid;
  const result = await controller.delete({
    cnsiGuid: req.cnsiGuid,
    cnsiName: req.cnsiName ?? req.cnsiGuid,
    entityKind: req.entityKind,
    deleteGuid: req.deleteGuid,
    deleteName,
    call: () => http.delete(req.path, { observe: 'response' }),
  }).done;
  if (result.state === 'failure' || result.state === 'blocked') {
    throw result.error ?? new Error(`Failed to delete ${req.entityKind} "${deleteName}"`);
  }
}
