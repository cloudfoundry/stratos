import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

import { GeneralEntityAppState, IRequestEntityTypeState } from './app-state';
import { entityCatalog } from './entity-catalog/entity-catalog';
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
import { IGroupedFavorites, IHydrationResults } from './types/user-favorite-manager.types';
import { IEndpointFavMetadata, IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';

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
    const entities = favEntitiesGuid.map(guid => this.mapToHydrated(favoriteEntities[guid]));
    if (!endpointFav) {
      return this.store.select(endpointEntitiesSelector).pipe(
        map(endpoints => {
          const endpointGuid = UserFavorite.getEntityGuidFromFavoriteGuid(endpointFavoriteGuid);
          const endpointEntity = endpoints[endpointGuid];
          return this.favoritesConfigMapper.getFavoriteEndpointFromEntity(endpointEntity);
        }),
        map(endpointFavorite => ({
          endpoint: this.mapToHydrated<IEndpointFavMetadata>(endpointFavorite),
          entities
        }))
      );
    }
    return of({
      endpoint: this.mapToHydrated<IEndpointFavMetadata>(endpointFav),
      entities
    });
  }

  private mapToHydrated = <T extends IFavoriteMetadata>(favorite: UserFavorite<T>): IHydrationResults<T> => {
    const catalogEntity = entityCatalog.getEntity(favorite.endpointType, favorite.entityType);

    return {
      type: catalogEntity.definition.type,
      cardMapper: this.favoritesConfigMapper.getMapperFunction(favorite),
      prettyName: catalogEntity.definition.label,
      favorite
    };
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
}
