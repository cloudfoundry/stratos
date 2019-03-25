import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

import { ToggleUserFavoriteAction } from '../../../store/src/actions/user-favourites-actions/toggle-user-favorite-action';
import { AppState, IRequestEntityTypeState } from '../../../store/src/app-state';
import { endpointEntitiesSelector } from '../../../store/src/selectors/endpoint.selectors';
import {
  errorFetchingFavoritesSelector,
  favoriteEntitiesSelector,
  favoriteGroupsSelector,
  fetchingFavoritesSelector,
} from '../../../store/src/selectors/favorite-groups.selectors';
import { isFavorite } from '../../../store/src/selectors/favorite.selectors';
import { IUserFavoritesGroups } from '../../../store/src/types/favorite-groups.types';
import {
  IEndpointFavMetadata,
  IFavoriteMetadata,
  UserFavorite,
  UserFavoriteEndpoint,
} from '../../../store/src/types/user-favorites.types';
import {
  favoritesConfigMapper,
  TFavoriteMapperFunction,
} from '../shared/components/favorites-meta-card/favorite-config-mapper';
import { LoggerService } from './logger.service';

export interface IFavoriteEntity {
  type: string;
  prettyName: string;
  cardMapper: TFavoriteMapperFunction<IFavoriteMetadata>;
  favorite: UserFavorite<IFavoriteMetadata>;
}

export interface IGroupedFavorites {
  endpoint: IHydrationResults<IEndpointFavMetadata>;
  entities: IHydrationResults[];
}


export interface IAllFavorites {
  fetching: boolean;
  error: boolean;
  entityGroups: IGroupedFavorites[];
}

export interface IHydrationResults<T extends IFavoriteMetadata = IFavoriteMetadata> {
  type: string;
  cardMapper: TFavoriteMapperFunction<any>;
  prettyName: string;
  favorite: UserFavorite<T>;
}

export class UserFavoriteManager {
  constructor(
    private store: Store<AppState>,
    private logger: LoggerService
    ) { }

  private getTypeAndID(favorite: UserFavorite<IFavoriteMetadata>) {
    const type = favorite.entityType;
    return {
      type,
      id: favorite.entityId || favorite.endpointId
    };
  }

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
          const endpointGuid = UserFavorite.getEntityGuidFromFavoriteGuid(endpointFavoriteGuid, this.logger);
          const endpointEntity = endpoints[endpointGuid];
          return new UserFavoriteEndpoint(
            endpointGuid,
            endpointEntity.cnsi_type,
            endpointEntity
          );
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
    return {
      type: this.getTypeAndID(favorite).type,
      cardMapper: favoritesConfigMapper.getMapperFunction(favorite),
      prettyName: favoritesConfigMapper.getPrettyTypeName(favorite),
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
    this.store.dispatch(new ToggleUserFavoriteAction(favorite));
  }
}
