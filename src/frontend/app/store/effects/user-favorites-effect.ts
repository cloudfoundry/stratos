import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, switchMap, withLatestFrom, map, tap } from 'rxjs/operators';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';
import { GetUserFavoritesAction } from '../actions/user-favourites-actions/get-user-favorites-action';
import { SaveUserFavoriteAction } from '../actions/user-favourites-actions/save-user-favorite-action';
import { AppState } from '../app-state';
import { entityFactory, userFavoritesSchemaKey } from '../helpers/entity-factory';
import { NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction, StartRequestAction, WrapperRequestActionSuccess } from '../types/request.types';
import { environment } from '../../../environments/environment';
import {
  UpdateUserFavoriteMetadataAction,
  UpdateUserFavoriteMetadataSuccessAction
} from '../actions/user-favourites-actions/update-user-favorite-metadata-action';
import { IFavoriteMetadata, UserFavorite, userFavoritesPaginationKey } from '../types/user-favorites.types';
import { RemoveUserFavoriteAction } from '../actions/user-favourites-actions/remove-user-favorite-action';
import { ToggleUserFavoriteAction } from '../actions/user-favourites-actions/toggle-user-favorite-action';
import { UserFavoriteManager } from '../../core/user-favorite-manager';

const { proxyAPIVersion } = environment;
const favoriteUrlPath = `/pp/${proxyAPIVersion}/favorites`;
@Injectable()
export class UserFavoritesEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  private userFavoriteManager = new UserFavoriteManager(this.store);

  @Effect() saveFavorite$ = this.actions$.ofType<SaveUserFavoriteAction>(SaveUserFavoriteAction.ACTION_TYPE).pipe(
    withLatestFrom(
      new PaginationMonitor<UserFavorite<IFavoriteMetadata>>(
        this.store, userFavoritesPaginationKey,
        entityFactory(userFavoritesSchemaKey)
      ).currentPage$
    ),
    mergeMap(([action, favorites]: [SaveUserFavoriteAction, UserFavorite<IFavoriteMetadata>[]]) => {
      const apiAction = {
        entityKey: userFavoritesSchemaKey,
        type: action.type,
      } as IRequestAction;

      this.store.dispatch(new StartRequestAction(apiAction));

      return this.http.post<UserFavorite<IFavoriteMetadata>>(favoriteUrlPath, action.favorite).pipe(
        mergeMap(newFavorite => {
          const entities = {
            [userFavoritesSchemaKey]: {
              ...favorites.reduce((favObj, favoriteFromArray) => ({
                ...favObj,
                [UserFavorite.buildFavoriteStoreEntityGuid(favoriteFromArray)]: favoriteFromArray
              }), {}),
              [newFavorite.guid]: newFavorite
            }
          };

          const mappedData = {
            entities,
            result: Object.keys(entities[userFavoritesSchemaKey]),
            totalPages: 1
          } as NormalizedResponse<UserFavorite<IFavoriteMetadata>>;

          const pagintionAction = {
            ...apiAction,
            paginationKey: 'userFavorites'
          } as PaginatedAction;

          return [
            new WrapperRequestActionSuccess(mappedData, pagintionAction),
          ];
        })
      );


    })
  );

  @Effect() getFavorite$ = this.actions$.ofType<GetUserFavoritesAction>(GetUserFavoritesAction.ACTION_TYPE).pipe(
    switchMap((action: GetUserFavoritesAction) => {
      const apiAction = {
        entityKey: userFavoritesSchemaKey,
        type: action.type,
        paginationKey: 'userFavorites'
      } as PaginatedAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      return this.http.get<UserFavorite<IFavoriteMetadata>[]>(favoriteUrlPath).pipe(
        map(favorites => {
          return favorites.reduce<NormalizedResponse<UserFavorite<IFavoriteMetadata>>>((mappedData, favorite) => {
            const { guid } = favorite;
            if (guid) {
              mappedData.entities[userFavoritesSchemaKey][guid] = favorite;
              mappedData.result.push(guid);
            }
            return mappedData;
          }, { entities: { [userFavoritesSchemaKey]: {} }, result: [] });
        }),
        map(mappedData => new WrapperRequestActionSuccess(mappedData, apiAction))
      );
    })
  );

  @Effect() toggleFavorite = this.actions$.ofType<ToggleUserFavoriteAction>(ToggleUserFavoriteAction.ACTION_TYPE).pipe(
    switchMap(action =>
      this.userFavoriteManager.getIsFavoriteObservable(action.favorite).pipe(
        tap(isFav => {
          if (isFav) {
            this.store.dispatch(new RemoveUserFavoriteAction(action.favorite.guid));
          } else {
            this.store.dispatch(new SaveUserFavoriteAction(action.favorite));
          }
        })
      )
    )
  );

  @Effect() removeFavorite$ = this.actions$.ofType<RemoveUserFavoriteAction>(RemoveUserFavoriteAction.ACTION_TYPE).pipe(
    withLatestFrom(
      new PaginationMonitor<
        UserFavorite<IFavoriteMetadata>
      >(this.store, userFavoritesPaginationKey, entityFactory(userFavoritesSchemaKey)).currentPage$
    ),
    switchMap(([action, favorites]: [RemoveUserFavoriteAction, UserFavorite<IFavoriteMetadata>[]]) => {
      const apiAction = {
        entityKey: userFavoritesSchemaKey,
        type: action.type,
        paginationKey: 'userFavorites'
      } as PaginatedAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      return this.http.delete<UserFavorite<IFavoriteMetadata>>(`${favoriteUrlPath}/${action.guid}`).pipe(
        map(() => {
          return favorites.reduce<NormalizedResponse<UserFavorite<IFavoriteMetadata>>>((mappedData, favorite) => {
            const { guid } = favorite;
            if (guid && guid !== action.guid) {
              mappedData.entities[userFavoritesSchemaKey][guid] = favorite;
              mappedData.result.push(guid);
            }
            return mappedData;
          }, { entities: { [userFavoritesSchemaKey]: {} }, result: [] });
        }),
        map(mappedData => new WrapperRequestActionSuccess(mappedData, apiAction))
      );
    })
  );

  @Effect() updateMetatdata$ = this.actions$.ofType<UpdateUserFavoriteMetadataAction>(UpdateUserFavoriteMetadataAction.ACTION_TYPE).pipe(
    mergeMap((action: UpdateUserFavoriteMetadataAction) => {
      return this.http.post<UserFavorite<IFavoriteMetadata>>(
        `${favoriteUrlPath}/${action.favorite.guid}/metadata`,
        action.favorite.metadata
      ).pipe(
        map(() => {
          return new UpdateUserFavoriteMetadataSuccessAction(action.favorite);
        })
      );
    })
  );
}
