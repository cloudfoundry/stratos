import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, distinctUntilChanged, map } from 'rxjs';

import { proxyAPIVersion } from '../jetstream';
import { getDefaultFavoriteGroup, IUserFavoriteGroup, IUserFavoritesGroups } from '../types/favorite-groups.types';
import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';
import { getEndpointIDFromFavorite } from '../user-favorite-helpers';

const favoriteUrlPath = `/pp/${proxyAPIVersion}/favorites`;

type Favorite = UserFavorite<IFavoriteMetadata>;

/**
 * Signal-native owner of the user-favorites map, replacing the `userFavorite`
 * ngrx entity stack: `user-favorites-effect.ts` (HTTP), `favorite.reducer.ts`
 * (the flat entities map), `user-favorites-groups.reducer.ts` (the
 * `userFavoritesGroups` slice) and the favorite/favorite-groups selectors.
 *
 * One `WritableSignal<Map<guid, UserFavorite>>` is the single source of truth —
 * the flat entities map AND the per-endpoint groups both derive from it (the
 * legacy dual-structure collapses, see [[feedback_no_phased_deferrals]] /
 * favorites-island W3). HTTP is lifted verbatim from the former effect against
 * `/pp/${proxyAPIVersion}/favorites`.
 *
 * `UserFavoriteManager` is the public facade for ~20 consumers and delegates
 * to this service; its method signatures stay byte-identical.
 */
@Injectable({ providedIn: 'root' })
export class UserFavoritesDataService {
  private http = inject(HttpClient);

  private readonly _favorites = signal<Map<string, Favorite>>(new Map());
  private readonly _fetching = signal(false);
  private readonly _error = signal(false);

  /** The flat favorites map, keyed by favorite guid. */
  readonly favorites: Signal<Map<string, Favorite>> = this._favorites.asReadonly();
  /** True while the favorites GET is in flight (legacy `busy`). */
  readonly fetching: Signal<boolean> = this._fetching.asReadonly();
  /** True if the last favorites GET failed (legacy groups `error`). */
  readonly error: Signal<boolean> = this._error.asReadonly();

  /**
   * Per-endpoint favorite groups, computed from the map. Byte-identical to the
   * former `userFavoriteGroupsReducer.buildFavoritesGroups` applied to the
   * current favorites — entity favorites land under their endpoint's group key
   * (ethereal until the endpoint itself is starred).
   */
  readonly groups: Signal<IUserFavoritesGroups> = computed(
    () => this.buildGroups(Array.from(this._favorites().values())),
  );

  // ---- observable surface (legacy rxjs consumers via the manager) ---------
  readonly favorites$: Observable<Map<string, Favorite>> = toObservable(this._favorites);
  readonly groups$: Observable<IUserFavoritesGroups> = toObservable(this.groups);
  readonly fetching$: Observable<boolean> = toObservable(this._fetching);
  readonly error$: Observable<boolean> = toObservable(this._error);

  // ---- reads --------------------------------------------------------------

  /**
   * Whether the given favorite is currently starred. Equivalent to the legacy
   * `isFavoriteSelector`: an entity favorite is favorited iff its guid is in the
   * map; an endpoint favorite is favorited iff the endpoint star (its own guid)
   * is in the map (i.e. the group is non-ethereal). Both reduce to `map.has`.
   */
  isFavorite(favorite: Favorite): Signal<boolean> {
    return computed(() => (favorite ? this._favorites().has(favorite.guid) : false));
  }

  isFavorite$(favorite: Favorite): Observable<boolean> {
    return this.favorites$.pipe(
      map(favs => (favorite ? favs.has(favorite.guid) : false)),
      distinctUntilChanged(),
    );
  }

  // ---- writes -------------------------------------------------------------

  /** Fetch all favorites (legacy `GetUserFavoritesAction`). Fire-and-forget. */
  load(): void {
    this._fetching.set(true);
    this._error.set(false);
    this.http.get<Favorite[]>(favoriteUrlPath).subscribe({
      next: favorites => {
        const next = new Map<string, Favorite>();
        (favorites || []).forEach(favorite => {
          if (favorite?.guid) {
            next.set(favorite.guid, favorite);
          }
        });
        this._favorites.set(next);
        this._fetching.set(false);
      },
      error: () => {
        this._fetching.set(false);
        this._error.set(true);
      },
    });
  }

  /** Create/persist a favorite (legacy `SaveUserFavoriteAction`). */
  save(favorite: Favorite): void {
    if (!favorite?.getPayload) {
      console.error('User favorites: save - favorite is null or has no payload', { favorite });
      return;
    }
    this.http.post<Favorite>(favoriteUrlPath, favorite.getPayload()).subscribe({
      // Store the server response, exactly as the effect did via SaveUserFavoriteSuccessAction.
      next: newFavorite => this.putFavorite(newFavorite || favorite),
      error: error => console.error('User favorites: save failed', { favorite, error }),
    });
  }

  /** Remove a favorite (legacy `RemoveUserFavoriteAction`). */
  remove(favorite: Favorite): void {
    if (!favorite?.guid) {
      console.error('User favorites: remove - favorite is null or has no guid', { favorite });
      return;
    }
    this.deleteByGuid(favorite.guid);
  }

  /** Toggle a favorite on/off (legacy `ToggleUserFavoriteAction`). */
  toggle(favorite: Favorite): void {
    if (!favorite?.guid) {
      console.error('User favorites: toggle - favorite is null or has no guid', { favorite });
      return;
    }
    if (this._favorites().has(favorite.guid)) {
      this.remove(favorite);
    } else {
      this.save(favorite);
    }
  }

  /** Persist updated metadata for a favorite (legacy `UpdateUserFavoriteMetadataAction`). */
  updateMetadata(favorite: Favorite): void {
    if (!favorite?.guid) {
      console.error('User favorites: updateMetadata - favorite is null or has no guid', { favorite });
      return;
    }
    this.http.post<Favorite>(`${favoriteUrlPath}/${favorite.guid}/metadata`, favorite.metadata).subscribe({
      next: () => this.putFavorite(favorite),
      error: error => console.error('User favorites: updateMetadata failed', { guid: favorite.guid, error }),
    });
  }

  /**
   * Remove the favorite for a just-deleted entity (the favorites half of the
   * shared delete-cleanup seam). No-op — and no HTTP — when the entity was not
   * favorited, so non-favoritable deletes stay quiet.
   */
  removeForDeletedEntity(guid: string): void {
    if (!guid || !this._favorites().has(guid)) {
      return;
    }
    this.deleteByGuid(guid);
  }

  // ---- internals ----------------------------------------------------------

  private deleteByGuid(guid: string): void {
    this.http.delete<Favorite>(`${favoriteUrlPath}/${guid}`).subscribe({
      next: () => this.removeFromMap(guid),
      error: error => console.error('User favorites: delete failed', { guid, error }),
    });
  }

  private putFavorite(favorite: Favorite): void {
    if (!favorite?.guid) {
      return;
    }
    this._favorites.update(prev => {
      const next = new Map(prev);
      next.set(favorite.guid, favorite);
      return next;
    });
  }

  private removeFromMap(guid: string): void {
    this._favorites.update(prev => {
      if (!prev.has(guid)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(guid);
      return next;
    });
  }

  private buildGroups(favorites: Favorite[]): IUserFavoritesGroups {
    return favorites.reduce((groups, favorite) => {
      const endpointGuid = getEndpointIDFromFavorite(favorite);
      groups[endpointGuid] = this.addFavoriteToGroup(groups[endpointGuid], favorite);
      return groups;
    }, {} as IUserFavoritesGroups);
  }

  // Ported verbatim from `user-favorites-groups.reducer.addFavoriteToGroup`.
  private addFavoriteToGroup(favoriteGroup: IUserFavoriteGroup = getDefaultFavoriteGroup(), favorite: Favorite): IUserFavoriteGroup {
    const fg = {
      ...favoriteGroup,
      entitiesIds: [...favoriteGroup.entitiesIds],
    };
    const { guid } = favorite;
    const isEndpoint = !favorite.entityId;
    if (isEndpoint) {
      fg.endpoint = favorite;
    }
    if (!isEndpoint && guid && !fg.entitiesIds.includes(guid)) {
      fg.entitiesIds.push(guid);
    }
    if (isEndpoint) {
      fg.ethereal = false;
    }
    return fg;
  }
}
