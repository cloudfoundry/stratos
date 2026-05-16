import { Action } from '@ngrx/store';

import { EndpointType } from '../extension-types';

export const REMOVE_ENTITIES_FOR_ENDPOINT = '[Endpoints] Remove all entities scoped to endpoint';

/**
 * Wave 4 part 2 (W36-B) — generic per-endpoint entity prune.
 *
 * Dispatched by {@link EndpointDisconnectCleanupService.runGenericDisconnectCleanup}
 * once per disconnect/unregister event. The matching reducer in
 * `request-data-reducer.factory.ts` walks every entity registered against
 * `endpointType` (via `entityCatalog.getAllEntitiesForEndpointType`) and
 * deletes any entry whose `cfGuid` (CF entities) or `endpointGuid` (git
 * entities) equals `endpointGuid`.
 *
 * Replaces the per-entity inline `endpointDisconnectRemoveEntitiesReducer()`
 * dataReducers (26 cf-entity-generator + 4 git-entity-generator
 * registrations) and the `endpoint-disconnect-application.reducer.ts` file.
 */
export class RemoveEntitiesForEndpoint implements Action {
  public type = REMOVE_ENTITIES_FOR_ENDPOINT;
  constructor(
    public endpointType: EndpointType,
    public endpointGuid: string,
  ) { }
}
