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
import { UserFavorite } from '../store/types/user-favorites.types';
import { EntityService } from './entity-service';
import { getActionGeneratorFromFavoriteType } from './user-favorite-helpers';
import { EntityInfo } from '../store/types/api.types';
import { ActionState } from '../store/reducers/api-request-reducer/types';

export interface IFavoriteEntity {
  type: string;
  entity: any;
}
export interface IAllFavorites {
  fetching: boolean;
  error: boolean;
  entities: IFavoriteEntity[];
}

export class UserFavoriteManager {
  constructor(private store: Store<AppState>) { }

  private getTypeAndID(favorite: UserFavorite) {
    if (favorite.entityId) {
      return {
        type: favorite.entityType,
        id: favorite.entityId
      };
    }
    return {
      type: favorite.endpointType,
      id: favorite.endpointId
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
    return paginationMonitor.pagination$.pipe(
      map(this.getCurrentPagePagination),
      filter(pageRequest => !!pageRequest),
      tap(({ error }) => {
        if (error) {
          throw new Error('Could not fetch favorites');
        }
      }),
      filter(({ busy }) => busy === false),
      switchMap(() => paginationMonitor.currentPage$),
      mergeMap(list => combineLatest(
        list.map(
          fav => this.hydrateFavorite(fav).pipe(
            filter(entityInfo => entityInfo.entityRequestInfo.fetching === false),
            map(entityInfo => ({
              entityInfo,
              type: this.getTypeAndID(fav).type
            }))
          )
        ))
      ),
      map((entityRequests) => ({
        error: entityRequests.findIndex(entityRequest => entityRequest.entityInfo.entityRequestInfo.error === true) > -1,
        fetching: false,
        entities: entityRequests.map(entityRequest => ({
          type: entityRequest.type,
          entity: entityRequest.entityInfo.entity
        }))
      })),
      catchError(() => observableOf({
        error: true,
        fetching: false,
        entities: null
      })),
      startWith({
        error: false,
        fetching: true,
        entities: null
      })
    );
  }

  public hydrateFavorite(favorite: UserFavorite): Observable<EntityInfo> {
    const { type, id } = this.getTypeAndID(favorite);
    const action = getActionGeneratorFromFavoriteType(favorite);
    if (action) {
      const entityMonitor = new EntityMonitor(this.store, id, type, entityFactory(type));

      if (favorite.endpointType === 'endpoint') {
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
    return observableOf(null);
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
