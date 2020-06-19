import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, first, map, mergeMap, switchMap } from 'rxjs/operators';

import { ClearPaginationOfEntity } from '../actions/pagination.actions';
import {
  GetUserFavoritesAction,
  GetUserFavoritesFailedAction,
  GetUserFavoritesSuccessAction,
  RemoveUserFavoriteAction,
  RemoveUserFavoriteSuccessAction,
  SaveUserFavoriteAction,
  SaveUserFavoriteSuccessAction,
  ToggleUserFavoriteAction,
  UpdateUserFavoriteMetadataAction,
  UpdateUserFavoriteMetadataSuccessAction,
} from '../actions/user-favourites.actions';
import { DispatchOnlyAppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { proxyAPIVersion } from '../jetstream';
import { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { IFavoriteMetadata, UserFavorite, userFavoritesPaginationKey } from '../types/user-favorites.types';
import { UserFavoriteManager } from '../user-favorite-manager';

const favoriteUrlPath = `/pp/${proxyAPIVersion}/favorites`;


@Injectable()
export class UserFavoritesEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<DispatchOnlyAppState>,
    private userFavoriteManager: UserFavoriteManager
  ) {
  }

  @Effect() saveFavorite = this.actions$.pipe(
    ofType<SaveUserFavoriteAction>(SaveUserFavoriteAction.ACTION_TYPE),
    mergeMap(action => {
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType))
      return this.http.post<UserFavorite<IFavoriteMetadata>>(favoriteUrlPath, action.favorite).pipe(
        mergeMap(newFavorite => [
          new WrapperRequestActionSuccess(null, action, actionType),
          new SaveUserFavoriteSuccessAction(newFavorite)
        ]),
        catchError(() => [
          new WrapperRequestActionFailed('Failed to update user favorite', action, actionType)
        ])
      );
    })
  );

  @Effect({ dispatch: false }) getFavorite$ = this.actions$.pipe(
    ofType<GetUserFavoritesAction>(GetUserFavoritesAction.ACTION_TYPE),
    mergeMap((action: GetUserFavoritesAction) => {
      const favEntityKey = entityCatalog.getEntityKey(action);
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType))
      return this.http.get<UserFavorite<IFavoriteMetadata>[]>(favoriteUrlPath).pipe(
        map(favorites => {
          const mappedData = favorites.reduce<NormalizedResponse<UserFavorite<IFavoriteMetadata>>>((data, favorite) => {
            const { guid } = favorite;
            if (guid) {
              data.entities[favEntityKey][guid] = favorite;
              data.result.push(guid);
            }
            return data;
          }, { entities: { [favEntityKey]: {} }, result: [] });
          return [
            new WrapperRequestActionSuccess(mappedData, action),
            new GetUserFavoritesSuccessAction(favorites)
          ]
        }),
        catchError(() => [
          new GetUserFavoritesFailedAction(),
          new WrapperRequestActionFailed('Failed to fetch user favorites', action, actionType)
        ])
      );
    })
  );

  @Effect() toggleFavorite = this.actions$.pipe(
    ofType<ToggleUserFavoriteAction>(ToggleUserFavoriteAction.ACTION_TYPE),
    mergeMap(action =>
      this.userFavoriteManager.getIsFavoriteObservable(action.favorite).pipe(
        first(),
        map(isFav => {
          if (isFav) {
            return new RemoveUserFavoriteAction(action.favorite);
          } else {
            return new SaveUserFavoriteAction(action.favorite);
          }
        })
      )
    )
  );

  @Effect({ dispatch: false }) removeFavorite$ = this.actions$.pipe(
    ofType<RemoveUserFavoriteAction>(RemoveUserFavoriteAction.ACTION_TYPE),
    switchMap((action: RemoveUserFavoriteAction) => {
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType))
      return this.http.delete<UserFavorite<IFavoriteMetadata>>(`${favoriteUrlPath}/${action.guid}`).pipe(
        map(() => [
          new WrapperRequestActionSuccess(null, action),
          new RemoveUserFavoriteSuccessAction(action.favorite),
          new ClearPaginationOfEntity(action.entity[0], action.guid, userFavoritesPaginationKey)
        ]),
        catchError(() => [
          new WrapperRequestActionFailed('Failed to remove user favorite', action, actionType)
        ])
      );
    })
  );

  @Effect() updateMetadata$ = this.actions$.pipe(
    ofType<UpdateUserFavoriteMetadataAction>(UpdateUserFavoriteMetadataAction.ACTION_TYPE),
    switchMap((action: UpdateUserFavoriteMetadataAction) => {
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType))
      return this.http.post<UserFavorite<IFavoriteMetadata>>(
        `${favoriteUrlPath}/${action.favorite.guid}/metadata`,
        action.favorite.metadata
      ).pipe(
        map(() => [
          new WrapperRequestActionSuccess(null, action),
          new UpdateUserFavoriteMetadataSuccessAction(action.favorite)
        ]),
        catchError(() => [
          new WrapperRequestActionFailed('Failed to update user favorite', action, actionType)
        ])
      );
    })
  );
}
