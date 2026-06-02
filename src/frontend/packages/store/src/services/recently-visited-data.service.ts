import { Injectable, Signal, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { IRecentlyVisitedEntity, IRecentlyVisitedState } from '../types/recently-visited.types';

// Maximum number of recent entities to show to the user.
export const MAX_RECENT_COUNT = 100;

// When the recent count goes above this, reduce it back down to the max. This
// avoids constantly trimming the list once the max is hit — we only ever show
// the max count in the UI lists.
const FLUSH_RECENT_COUNT = 150;

/**
 * Signal-native owner of the recently-visited entity map, replacing the
 * `recentlyVisited` ngrx slice (`recently-visited.reducer.ts` + selectors +
 * actions). Local-only state — no HTTP, no persistence — mirroring the legacy
 * reducer behaviour exactly:
 *
 *  - `add`                  ← `AddRecentlyVisitedEntityAction`   (adds + trims)
 *  - `set`                  ← `SetRecentlyVisitedEntityAction`   (upsert, no trim)
 *  - `cleanForEndpoints`    ← `CleanRecentsForEndpointsAction`   (drop matching)
 *  - `pruneToConnected`     ← `PruneRecentsToConnectedAction`    (keep matching)
 *  - `removeForDeletedEntity` ← `RemoveRecentEntityAction`       (drop by guid)
 *
 * Read surface mirrors `recentlyVisitedSelector` (the raw map); `state$`
 * preserves the legacy `store.select(recentlyVisitedSelector)` pipelines.
 */
@Injectable({ providedIn: 'root' })
export class RecentlyVisitedDataService {
  private readonly _state = signal<IRecentlyVisitedState>({});

  /** The recents map, keyed by favorite guid. */
  readonly state: Signal<IRecentlyVisitedState> = this._state.asReadonly();

  /** Observable mirror for legacy rxjs consumers (page name-sync, recents list). */
  readonly state$: Observable<IRecentlyVisitedState> = toObservable(this._state);

  /** An entity was 'hit' — update the access date or add it; trims old data. */
  add(recentlyVisited: IRecentlyVisitedEntity): void {
    this._state.update(state => this.trim({
      ...state,
      [recentlyVisited.guid]: recentlyVisited,
    }));
  }

  /** Upsert a single entry without trimming (e.g. a name refresh). */
  set(recentlyVisited: IRecentlyVisitedEntity): void {
    this._state.update(state => ({
      ...state,
      [recentlyVisited.guid]: recentlyVisited,
    }));
  }

  /** Drop recents referencing any of the supplied endpoint guids. */
  cleanForEndpoints(endpointGuids: string[]): void {
    this._state.update(state => this.clean(state, endpointGuids, false));
  }

  /** Keep only recents referencing one of the supplied endpoint guids. */
  pruneToConnected(connectedEndpointGuids: string[]): void {
    this._state.update(state => this.clean(state, connectedEndpointGuids, true));
  }

  /** Remove a single recents entry by its favorite guid (no-op if absent). */
  removeForDeletedEntity(guid: string): void {
    if (!this._state()[guid]) {
      return;
    }
    this._state.update(state => {
      const next = { ...state };
      delete next[guid];
      return next;
    });
  }

  // Ensure the recents list stays at a manageable size.
  private trim(state: IRecentlyVisitedState): IRecentlyVisitedState {
    if (Object.keys(state).length <= FLUSH_RECENT_COUNT) {
      return state;
    }
    // Cap the list at the maximum we can display, most-recent first.
    const sorted = Object.values(state).sort((a, b) => b.date - a.date).slice(0, MAX_RECENT_COUNT);
    return sorted.reduce((map, obj) => {
      map[obj.guid] = obj;
      return map;
    }, {} as IRecentlyVisitedState);
  }

  // Either remove any recents referencing an endpoint in the list, or keep only
  // those that do (inclusive).
  private clean(state: IRecentlyVisitedState, endpointGuids: string[], inclusive: boolean): IRecentlyVisitedState {
    const endpointMap = endpointGuids.reduce((m, guid) => {
      m[guid] = true;
      return m;
    }, {} as Record<string, boolean>);

    return Object.values(state)
      .filter(entity => (endpointMap[entity.endpointId] ? inclusive : !inclusive))
      .reduce((map, obj) => {
        map[obj.guid] = obj;
        return map;
      }, {} as IRecentlyVisitedState);
  }
}
