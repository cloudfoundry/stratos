import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map, filter, tap, switchMap } from 'rxjs/operators';
import { favoritesConfigMapper, TFavoriteMapperFunction } from '../shared/components/favorites-meta-card/favorite-config-mapper';
import { PaginationMonitor } from '../shared/monitors/pagination-monitor';
import { ToggleUserFavoriteAction } from '../store/actions/user-favourites-actions/toggle-user-favorite-action';
import { AppState, IRequestEntityTypeState } from '../store/app-state';
import { entityFactory, userFavoritesSchemaKey } from '../store/helpers/entity-factory';
import { favoriteEntitiesSelector, favoriteGroupsSelector } from '../store/selectors/favorite-groups.selectors';
import { isFavorite } from '../store/selectors/favorite.selectors';
import { IUserFavoritesGroupsState } from '../store/types/favorite-groups.types';
import { IFavoriteMetadata, UserFavorite, userFavoritesPaginationKey } from '../store/types/user-favorites.types';
import { IEndpointFavMetadata } from './../store/types/user-favorites.types';
import { PaginationEntityState } from '../store/types/pagination.types';

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

  private getTypeAndID(favorite: UserFavorite<IFavoriteMetadata>) {
    const type = favorite.entityType;
    return {
      type,
      id: favorite.entityId || favorite.endpointId
    };
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
    const favoriteGroups$ = this.store.select(favoriteGroupsSelector);
    const favoriteEntities$ = this.store.select(favoriteEntitiesSelector);
    const combined$ = combineLatest(
      favoriteGroups$,
      favoriteEntities$
    );
    return waitForFavorites$
      .pipe(
        switchMap(() => combined$)
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

  private getCurrentPagePagination(pagination: PaginationEntityState) {
    return pagination.pageRequests[pagination.currentPage];
  }

  public hydrateAllFavorites(): Observable<IGroupedFavorites[]> {
    return this.getHydrateObservable();
  }

  private getHydrateObservable() {
    return this.getAllFavorites().pipe(
      map(([groups, favoriteEntities]) => this.getHydratedGroups(groups, favoriteEntities))
    );
  }

  private getHydratedGroups = (
    groups: IUserFavoritesGroupsState,
    favoriteEntities: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>
  ): IGroupedFavorites[] => {
    return Object.keys(groups).map(endpointGuid => this.hydrateGroup(groups[endpointGuid].entitiesIds, endpointGuid, favoriteEntities));
  }

  private hydrateGroup(
    favEntitiesGuid: string[],
    endpointGuid: string,
    favoriteEntities: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>
  ): IGroupedFavorites {
    const endpointFav = favoriteEntities[endpointGuid] as UserFavorite<IEndpointFavMetadata>;
    const endpoint = this.mapToHydrated<IEndpointFavMetadata>(endpointFav);
    return {
      endpoint,
      entities: favEntitiesGuid.map(guid =>
        this.mapToHydrated(favoriteEntities[guid])),
    };
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
