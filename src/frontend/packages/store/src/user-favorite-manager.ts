import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

import { GeneralEntityAppState, IRequestEntityTypeState } from './app-state';
import { FavoritesConfigMapper } from './favorite-config-mapper';
import { endpointEntitiesSelector } from './selectors/endpoint.selectors';
import {
  errorFetchingFavoritesSelector,
  favoriteEntitiesSelector,
  favoriteGroupsSelector,
  fetchingFavoritesSelector,
} from './selectors/favorite-groups.selectors';
import { isFavorite } from './selectors/favorite.selectors';
import { stratosEntityCatalog } from './stratos-entity-catalog';
import { IUserFavoritesGroups } from './types/favorite-groups.types';
import { IEndpointFavMetadata, IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';


interface IGroupedFavorites {
  endpoint: UserFavorite<IEndpointFavMetadata>;
  entities: UserFavorite<IFavoriteMetadata>[];
}

@Injectable({
  providedIn: 'root'
})
export class UserFavoriteManager {
  constructor(
    private store: Store<GeneralEntityAppState>,
    private favoritesConfigMapper: FavoritesConfigMapper
  ) { }

  public getAllFavorites() {
    const waitForFavorites$ = this.getWaitForFavoritesObservable();
    const favoriteGroups$ = this.store.select(favoriteGroupsSelector);
    const favoriteEntities$ = this.store.select(favoriteEntitiesSelector);
    const combined$ = combineLatest(
      favoriteGroups$,
      favoriteEntities$
    );
    return waitForFavorites$
      .pipe(switchMap(() => combined$));
  }

  private getWaitForFavoritesObservable() {
    return combineLatest(
      this.store.select(fetchingFavoritesSelector),
      this.store.select(errorFetchingFavoritesSelector)
    ).pipe(
      tap(([fetching, error]) => {
        if (error) {
          throw new Error('Could not fetch favorites');
        }
      }),
      filter(([fetching]) => fetching === false),
    );
  }

  public hydrateAllFavorites(): Observable<IGroupedFavorites[]> {
    return this.getHydrateObservable();
  }

  private getHydrateObservable() {
    return this.getAllFavorites().pipe(
      filter(([groups, favoriteEntities]) => !!groups && !!favoriteEntities),
      switchMap(([groups, favoriteEntities]) => this.getHydratedGroups(groups, favoriteEntities))
    );
  }

  private getHydratedGroups = (
    groups: IUserFavoritesGroups,
    favoriteEntities: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>
  ): Observable<IGroupedFavorites[]> => {
    const hydrationResults$ = Object.keys(groups).map(
      endpointGuid => this.hydrateGroup(groups[endpointGuid].entitiesIds, endpointGuid, favoriteEntities)
    );
    if (!hydrationResults$ || !hydrationResults$.length) {
      return of([]);
    }
    return combineLatest(
      hydrationResults$
    );
  }

  private hydrateGroup(
    favEntitiesGuid: string[],
    endpointFavoriteGuid: string,
    favoriteEntities: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>
  ): Observable<IGroupedFavorites> {
    const endpointFav = favoriteEntities[endpointFavoriteGuid] as UserFavorite<IEndpointFavMetadata>;
    const entities = favEntitiesGuid.map(guid => this.getUserFavoriteFromObject(favoriteEntities[guid]));
    if (!endpointFav) {
      return this.store.select(endpointEntitiesSelector).pipe(
        map(endpoints => {
          const endpointGuid = UserFavorite.getEntityGuidFromFavoriteGuid(endpointFavoriteGuid);
          const endpointEntity = endpoints[endpointGuid];
          return this.favoritesConfigMapper.getFavoriteEndpointFromEntity(endpointEntity);
        }),
        map(endpointFavorite => ({
          endpoint: this.getUserFavoriteFromObject<IEndpointFavMetadata>(endpointFavorite),
          entities
        }))
      );
    }
    return of({
      endpoint: this.getUserFavoriteFromObject<IEndpointFavMetadata>(endpointFav),
      entities
    });
  }

  public getUserFavoriteFromObject = <T extends IFavoriteMetadata = IFavoriteMetadata>(f: UserFavorite<T>): UserFavorite<T> => {
    return new UserFavorite<T>(f.endpointId, f.endpointType, f.entityType, f.entityId, f.metadata);
  }

  public hydrateFavorite(favorite: UserFavorite<IFavoriteMetadata>): IFavoriteMetadata {
    return favorite.metadata;
  }

  public getIsFavoriteObservable(favorite: UserFavorite<IFavoriteMetadata>) {
    return this.store.select(
      isFavorite(favorite)
    );
  }

  public toggleFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
    stratosEntityCatalog.userFavorite.api.toggle(favorite);
  }

  // Get all favorites for the given endpoint ID
  public getFavoritesForEndpoint(endpointID: string): Observable<UserFavorite<IFavoriteMetadata>[]> {
    const waitForFavorites$ = this.getWaitForFavoritesObservable();
    const favoriteEntities$ = this.store.select(favoriteEntitiesSelector);
    return waitForFavorites$.pipe(switchMap(() => favoriteEntities$)).pipe(
      map(favs => {
        const result = [];
        Object.values(favs).forEach(f => {
          if (f.endpointId === endpointID && f.entityId) {
            // Ensure we actually have a UserFavorite object and not a struct
            result.push(this.getUserFavoriteFromObject(f));
          }
        })
        return result;
      })
    )
  }

  public getEndpointIDFromFavoriteID(id: string): string {
    const p = id.split('-');
    const idParts = p.slice(0, p.length - 2);
    return idParts.join('-');
  }
}
