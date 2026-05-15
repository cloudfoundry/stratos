import { Action } from '@ngrx/store';

import { IRecentlyVisitedEntity } from '../types/recently-visited.types';

export class AddRecentlyVisitedEntityAction implements Action {
  static ACTION_TYPE = '[Recently visited] Add';
  public type = AddRecentlyVisitedEntityAction.ACTION_TYPE;
  constructor(public recentlyVisited: IRecentlyVisitedEntity) {}
}

export class SetRecentlyVisitedEntityAction implements Action {
  static ACTION_TYPE = '[Recently visited] Set';
  public type = SetRecentlyVisitedEntityAction.ACTION_TYPE;
  constructor(public recentlyVisited: IRecentlyVisitedEntity) { }
}

/**
 * Wave 4 part 1 (W36-B) — drive recents cleanup from the EndpointsDataService
 * disconnect/unregister signal stream instead of the legacy
 * `*_ENDPOINTS_SUCCESS` action listeners on the recents reducer.
 *
 * Removes any recents entries whose `endpointId` matches one of the supplied
 * guids. Mirrors the legacy behaviour the reducer used to do inline on
 * `DISCONNECT_ENDPOINTS_SUCCESS` / `UNREGISTER_ENDPOINTS_SUCCESS`.
 */
export class CleanRecentsForEndpointsAction implements Action {
  static ACTION_TYPE = '[Recently visited] Clean for endpoints';
  public type = CleanRecentsForEndpointsAction.ACTION_TYPE;
  constructor(public endpointGuids: string[]) { }
}

/**
 * Wave 4 part 1 (W36-B) — drive recents pruning from the EndpointsDataService
 * `endpoints` signal instead of the legacy `GET_ENDPOINTS_SUCCESS` reducer
 * listener. Keeps only recents whose `endpointId` is in the supplied set.
 */
export class PruneRecentsToConnectedAction implements Action {
  static ACTION_TYPE = '[Recently visited] Prune to connected';
  public type = PruneRecentsToConnectedAction.ACTION_TYPE;
  constructor(public connectedEndpointGuids: string[]) { }
}

