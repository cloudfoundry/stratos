import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { catchError, filter, first, map, switchMap, tap, mergeMap, startWith } from 'rxjs/operators';
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { PaginationMonitor } from '../shared/monitors/pagination-monitor';
import { RemoveUserFavoriteAction } from '../store/actions/user-favourites-actions/remove-user-favorite-action';
import { SaveUserFavoriteAction } from '../store/actions/user-favourites-actions/save-user-favorite-action';
import { AppState } from '../store/app-state';
import { userFavoritesPaginationKey } from '../store/effects/user-favorites-effect';
import { entityFactory, userFavoritesSchemaKey } from '../store/helpers/entity-factory';
import { isFavorite } from '../store/selectors/favorite.selectors';
import { PaginationEntityState } from '../store/types/pagination.types';
import { UserFavorite, UserFavoriteEndpoint } from '../store/types/user-favorites.types';
import { EntityService } from './entity-service';
import { EntityInfo } from '../store/types/api.types';
import { EndpointModel } from '../store/types/endpoint.types';
import {
  favoritesConfigMapper, TFavoriteMapperFunction
} from '../shared/components/favorites-meta-card/favorite-config-mapper';
import { getDefaultRequestState } from '../store/reducers/api-request-reducer/types';
interface IntermediateFavoritesGroup {
  [endpointId: string]: UserFavorite[];
}

export interface IGroupedFavorites {
  endpoint: IEndpointFavoriteEntity;
  entities: IFavoriteEntity[];
}

export interface IEndpointFavoriteEntity extends IFavoriteEntity {
  entity: EndpointModel;
}

export interface IFavoriteEntity {
  type: string;
  prettyName: string;
  cardMapper: TFavoriteMapperFunction;
  entity: any;
  favorite: UserFavorite;
}
export interface IAllFavorites {
  fetching: boolean;
  error: boolean;
  entityGroups: IGroupedFavorites[];
}

export interface IHydrationResults {
  entityInfo: EntityInfo<any>;
  type: string;
  cardMapper: TFavoriteMapperFunction;
  prettyName: string;
  favorite: UserFavorite;
}

export class UserFavoriteManager {
  constructor(private store: Store<AppState>) { }

  private groupIntermediateFavorites = (favorites: UserFavorite[]): UserFavorite[][] => {
    const intermediateFavoritesGroup = favorites.reduce((intermediate: IntermediateFavoritesGroup, favorite: UserFavorite) => {
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
    }, [] as UserFavorite[][]);
  }

  private groupFavoriteEntities(intermediateEntitiesGroup: IFavoriteEntity[][]): IGroupedFavorites[] {
    return Object.values(intermediateEntitiesGroup).reduce((group: IGroupedFavorites[], userFavorites: IFavoriteEntity[]) => {
      const [
        endpoint,
        ...entities
      ] = userFavorites;
      group.push({
        endpoint,
        entities: entities && entities.length ? entities : null
      });
      return group;
    }, [] as IGroupedFavorites[]);
  }

  private getTypeAndID(favorite: UserFavorite) {
    const type = favorite.entityType;
    return {
      type,
      id: favorite.entityId || favorite.endpointId
    };
  }

  private getCurrentPagePagination(pagination: PaginationEntityState) {
    return pagination.pageRequests[pagination.currentPage];
  }

  public hydrateAllFavorites(): Observable<IAllFavorites> {
    const paginationMonitor = new PaginationMonitor<UserFavorite>(
      this.store,
      userFavoritesPaginationKey,
      entityFactory(userFavoritesSchemaKey)
    );

    const waitForFavorites$ = paginationMonitor.pagination$.pipe(
      map(this.getCurrentPagePagination),
      filter(pageRequest => !!pageRequest),
      tap(({ error }) => {
        if (error) {
          throw new Error('Could not fetch favorites');
        }
      }),
      filter(({ busy }) => busy === false),
    );

    return waitForFavorites$.pipe(
      switchMap(() => paginationMonitor.currentPage$.pipe(
        map(this.addEndpointsToHydrateList)
      )),
      map(this.groupIntermediateFavorites),
      mergeMap(this.getHydratedGroups),
      map(this.reduceGroupedRequests),
      catchError(e => {
        return observableOf({
          error: true,
          fetching: false,
          entityGroups: null
        });
      }),
      startWith({
        error: false,
        fetching: true,
        entityGroups: null
      })
    );
  }

  private reduceGroupedRequests = (entityRequests: IHydrationResults[][]): IAllFavorites => {
    if (!entityRequests) {
      return {
        error: false,
        fetching: false,
        entityGroups: null
      };
    }
    return {
      error: !!entityRequests.findIndex(entityRequest => {
        return entityRequest.findIndex((request) => request.entityInfo.entityRequestInfo.error === false) > -1;
      }),
      fetching: false,
      entityGroups: this.groupFavoriteEntities(entityRequests.map(entityRequest => entityRequest.map(request => ({
        type: request.type,
        cardMapper: request.cardMapper,
        prettyName: request.prettyName,
        entity: request.entityInfo.entity,
        favorite: request.favorite
      }))))
    };
  }

  private getHydratedGroups = (list: UserFavorite[][]) => {
    if (!list || !list.length) {
      return observableOf(null);
    }
    return combineLatest(list.map(
      favGroup => combineLatest(favGroup.map(favorite => this.hydrateFavorite(favorite).pipe(
        filter(entityInfo => !entityInfo || entityInfo.entityRequestInfo.fetching === false),
        map(entityInfo => ({
          entityInfo,
          type: this.getTypeAndID(favorite).type,
          cardMapper: favoritesConfigMapper.getMapperFunction(favorite),
          prettyName: favoritesConfigMapper.getPrettyName(favorite),
          favorite
        })))
      ))
    ));
  }

  public addEndpointsToHydrateList = (favorites: UserFavorite[]) => {
    return favorites.reduce((newFavorites: UserFavorite[], favorite) => {
      const hasEndpoint = this.hasEndpointAsFavorite(newFavorites, favorite);
      if (!hasEndpoint) {
        // Bug with faved entities that have been removed still being in the favorite list
        // causing a cf to be added
        // Should some how not do this
        const endpointFavorite = new UserFavoriteEndpoint(
          favorite.endpointId,
          favorite.endpointType
        );
        newFavorites.push(endpointFavorite);
      }
      return newFavorites;
    }, favorites);
  }

  public hasEndpointAsFavorite(allFavorites: UserFavorite[], favoriteToFindEndpoint: UserFavorite) {
    if (this.isEndpointType(favoriteToFindEndpoint)) {
      return true;
    }
    return !!allFavorites.find(favorite => this.isEndpointType(favorite) && favorite.endpointId === favoriteToFindEndpoint.endpointId);
  }

  private isEndpointType(favorite: UserFavorite) {
    return !favorite.entityId;
  }

  public hydrateFavorite(favorite: UserFavorite): Observable<EntityInfo> {
    const { type, id } = this.getTypeAndID(favorite);
    const action = favoritesConfigMapper.getActionFromFavorite(favorite);
    if (action) {
      const entityMonitor = new EntityMonitor(this.store, id, type, entityFactory(type));

      if (favorite.entityType === 'endpoint') {
        return combineLatest(entityMonitor.entity$, entityMonitor.entityRequest$).pipe(
          map(([entity, entityRequestInfo]) => ({ entity, entityRequestInfo }))
        );
      }

      const entityService = new EntityService(
        this.store,
        entityMonitor,
        action
      );
      return entityService.entityObs$;
    }
    return observableOf({
      entity: null,
      entityRequestInfo: getDefaultRequestState()
    });
  }

  public getIsFavoriteObservable(favorite: UserFavorite) {
    return this.store.select(
      isFavorite(favorite)
    );
  }

  public toggleFavorite(favorite: UserFavorite) {
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
