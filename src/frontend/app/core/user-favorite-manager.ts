import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap, tap } from 'rxjs/operators';
import { favoritesConfigMapper, TFavoriteMapperFunction } from '../shared/components/favorites-meta-card/favorite-config-mapper';
import { PaginationMonitor } from '../shared/monitors/pagination-monitor';
import { RemoveUserFavoriteAction } from '../store/actions/user-favourites-actions/remove-user-favorite-action';
import { SaveUserFavoriteAction } from '../store/actions/user-favourites-actions/save-user-favorite-action';
import { AppState } from '../store/app-state';
import { userFavoritesPaginationKey } from '../store/effects/user-favorites-effect';
import { entityFactory, userFavoritesSchemaKey } from '../store/helpers/entity-factory';
import { endpointEntitiesSelector } from '../store/selectors/endpoint.selectors';
import { isFavorite } from '../store/selectors/favorite.selectors';
import { EndpointModel } from '../store/types/endpoint.types';
import { PaginationEntityState } from '../store/types/pagination.types';
import { IFavoriteMetadata, UserFavorite, UserFavoriteEndpoint } from '../store/types/user-favorites.types';
import { IEndpointFavMetadata } from './../store/types/user-favorites.types';
interface IntermediateFavoritesGroup {
  [endpointId: string]: UserFavorite<IFavoriteMetadata>[];
}

export interface IFavoriteEntity {
  type: string;
  prettyName: string;
  cardMapper: TFavoriteMapperFunction<IFavoriteMetadata>;
  entity: any;
  favorite: UserFavorite<IFavoriteMetadata>;
}

export interface IGroupedFavorites {
  endpoint: IHydrationResults<IEndpointFavMetadata>;
  entities: IHydrationResults[];
}

export interface IEndpointFavoriteEntity extends IFavoriteEntity {
  entity: EndpointModel;
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
  constructor(private store: Store<AppState>) { }

  private groupIntermediateFavorites = (favorites: UserFavorite<IFavoriteMetadata>[]): UserFavorite<IFavoriteMetadata>[][] => {
    const intermediateFavoritesGroup = favorites.reduce((
      intermediate: IntermediateFavoritesGroup, favorite: UserFavorite<IFavoriteMetadata>
    ) => {
      const { endpointId } = favorite;
      if (!intermediate[endpointId]) {
        intermediate[endpointId] = [];
      }
      const isEndpoint = this.isEndpointType(favorite);
      if (isEndpoint) {
        intermediate[endpointId].unshift(favorite);
      } else {
        intermediate[endpointId].push(favorite);
      }
      return intermediate;
    }, {} as IntermediateFavoritesGroup);

    return Object.values(intermediateFavoritesGroup).reduce((favsArray, favs) => {
      favsArray.push(favs);
      return favsArray;
    }, [] as UserFavorite<IFavoriteMetadata>[][]);
  }

  private getTypeAndID(favorite: UserFavorite<IFavoriteMetadata>) {
    const type = favorite.entityType;
    return {
      type,
      id: favorite.entityId || favorite.endpointId
    };
  }

  private getCurrentPagePagination(pagination: PaginationEntityState) {
    return pagination.pageRequests[pagination.currentPage];
  }

  public getFavoritesMonitor() {
    return new PaginationMonitor<UserFavorite<IFavoriteMetadata>>(
      this.store,
      userFavoritesPaginationKey,
      entityFactory(userFavoritesSchemaKey)
    );
  }

  public getAllFavorites() {
    const paginationMonitor = this.getFavoritesMonitor();
    const waitForFavorites$ = this.getWaitForFavoritesObservable(paginationMonitor);
    return waitForFavorites$.pipe(
      switchMap(() => paginationMonitor.currentPage$)
    );
  }

  public hydrateAllFavorites(): Observable<IGroupedFavorites[]> {
    return this.getHydrateObservable();
  }

  private getHydrateObservable() {
    return this.getAllFavorites().pipe(
      switchMap(this.addEndpointsToHydrateList),
      tap(console.log),
      map(this.groupIntermediateFavorites),
      tap(console.log),
      map(this.getHydratedGroups),

      tap(console.log),
    );
  }

  private getWaitForFavoritesObservable(paginationMonitor: PaginationMonitor<UserFavorite<IFavoriteMetadata>>) {
    return paginationMonitor.pagination$.pipe(
      map(this.getCurrentPagePagination),
      filter(pageRequest => !!pageRequest),
      tap(({ error }) => {
        if (error) {
          throw new Error('Could not fetch favorites');
        }
      }),
      filter(({ busy }) => busy === false),
    );
  }

  private getHydratedGroups = (list: UserFavorite<IFavoriteMetadata>[][]): IGroupedFavorites[] => {
    if (!list || !list.length) {
      return null;
    }
    return list.map(favGroup => this.hydrateGroup(favGroup));
  }

  private hydrateGroup(favGroup: UserFavorite<IFavoriteMetadata>[]): IGroupedFavorites {
    const endpointIndex = favGroup.findIndex(fav => fav.entityType === 'endpoint');
    const endpointFav = favGroup.splice(endpointIndex, 1)[0] as UserFavorite<IEndpointFavMetadata>
    const endpoint = this.mapToHydrated<IEndpointFavMetadata>(endpointFav);
    return {
      endpoint,
      entities: favGroup.map(this.mapToHydrated),
    };
  }

  private mapToHydrated = <T extends IEndpointFavMetadata = IEndpointFavMetadata>(favorite: UserFavorite<T>): IHydrationResults<T> => {
    return {
      type: this.getTypeAndID(favorite).type,
      cardMapper: favoritesConfigMapper.getMapperFunction(favorite),
      prettyName: favoritesConfigMapper.getPrettyName(favorite),
      favorite
    };
  }

  public addEndpointsToHydrateList = (favorites: UserFavorite<IFavoriteMetadata>[]) => {
    const favoriteObservables$ = favorites.reduce((newFavorites: Observable<UserFavorite<IFavoriteMetadata>>[], favorite) => {
      const hasEndpoint = this.hasEndpointAsFavorite(favorites, favorite);
      if (!hasEndpoint) {
        newFavorites.push(this.store.select(endpointEntitiesSelector).pipe(
          map(endpoints => {
            const endpoint = endpoints[favorite.endpointId];
            return new UserFavoriteEndpoint(
              favorite.endpointId,
              favorite.endpointType,
              endpoint
            );
          })
        ));
      }
      return newFavorites;
    }, []);
    const currentFavs$ = observableOf(favorites);
    if (!favoriteObservables$.length) {
      return currentFavs$;
    }
    return combineLatest(currentFavs$, combineLatest(favoriteObservables$)).pipe(
      map(([base, newFavs]) => [
        ...base,
        ...newFavs
      ])
    );

  }

  public hasEndpointAsFavorite(allFavorites: UserFavorite<IFavoriteMetadata>[], favoriteToFindEndpoint: UserFavorite<IFavoriteMetadata>) {
    if (this.isEndpointType(favoriteToFindEndpoint)) {
      return true;
    }
    return !!allFavorites.find(favorite => this.isEndpointType(favorite) && favorite.endpointId === favoriteToFindEndpoint.endpointId);
  }

  private isEndpointType(favorite: UserFavorite<IFavoriteMetadata>) {
    return !favorite.entityId;
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
    this.getIsFavoriteObservable(favorite).pipe(
      first(),
      tap(isFav => {
        if (isFav) {
          this.store.dispatch(new RemoveUserFavoriteAction(favorite.guid));
        } else {
          this.store.dispatch(new SaveUserFavoriteAction(favorite));
        }
      })
    ).subscribe();
  }
}
