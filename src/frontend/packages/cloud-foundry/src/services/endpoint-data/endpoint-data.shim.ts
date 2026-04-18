import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { StEndpointData } from './stratos-types';

@Injectable({ providedIn: 'root' })
export class EndpointDataShim {
  private readonly store = inject(Store);

  write(_cnsiGuid: string, _data: StEndpointData): void {
    // TODO: Implement write-through once the correct NgRx bulk-entity action is confirmed.
    // WrapperRequestActionSuccess exists in the store package but requires a full
    // EntityRequestAction or PaginatedAction as its apiAction parameter — there is
    // no simple bulk-entity injection path without constructing a synthetic action.
    // Old pages continue fetching via their existing passthru mechanism in
    // CloudFoundryEndpointService (fetchOrgs, fetchApps, fetchRouteCount).
    // No regression introduced by this stub.
  }
}
