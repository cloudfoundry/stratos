import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, switchMap, withLatestFrom, map, tap, first, catchError } from 'rxjs/operators';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';
import { GetUserFavoritesAction, GetUserFavoritesSuccessAction, GetUserFavoritesFailedAction } from '../actions/user-favourites-actions/get-user-favorites-action';
import { SaveUserFavoriteSuccessAction, SaveUserFavoriteAction } from '../actions/user-favourites-actions/save-user-favorite-action';
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
import { RemoveUserFavoriteAction, RemoveUserFavoriteSuccessAction } from '../actions/user-favourites-actions/remove-user-favorite-action';
import { ToggleUserFavoriteAction } from '../actions/user-favourites-actions/toggle-user-favorite-action';
import { UserFavoriteManager } from '../../core/user-favorite-manager';
import { PaginationRemoveIdAction } from '../actions/pagination.actions';

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

  @Effect() saveFavorite = this.actions$.ofType<SaveUserFavoriteAction>(SaveUserFavoriteAction.ACTION_TYPE).pipe(
    mergeMap(action => {
      return this.http.post<UserFavorite<IFavoriteMetadata>>(favoriteUrlPath, action.favorite).pipe(
        mergeMap(newFavorite => {
          return [
            new SaveUserFavoriteSuccessAction(newFavorite)
          ];
        })
      );
    }),
    catchError(e => {
      console.log(e)
      return [];
    })
  );

  @Effect({ dispatch: false }) getFavorite$ = this.actions$.ofType<GetUserFavoritesAction>(GetUserFavoritesAction.ACTION_TYPE).pipe(
    switchMap((action: GetUserFavoritesAction) => {
      const apiAction = {
        entityKey: userFavoritesSchemaKey,
        type: action.type
      } as PaginatedAction;
      return this.http.get<UserFavorite<IFavoriteMetadata>[]>(favoriteUrlPath).pipe(
        map(favorites => {
          const mappedData = favorites.reduce<NormalizedResponse<UserFavorite<IFavoriteMetadata>>>((mappedData, favorite) => {
            const { guid } = favorite;
            if (guid) {
              mappedData.entities[userFavoritesSchemaKey][guid] = favorite;
              mappedData.result.push(guid);
            }
            return mappedData;
          }, { entities: { [userFavoritesSchemaKey]: {} }, result: [] });
          this.store.dispatch(new WrapperRequestActionSuccess(mappedData, apiAction));
          this.store.dispatch(new GetUserFavoritesSuccessAction(favorites));
        }),
        catchError(e => {
          this.store.dispatch(new GetUserFavoritesFailedAction());
          throw e;
        })
      );
    })
  );

  @Effect() toggleFavorite = this.actions$.ofType<ToggleUserFavoriteAction>(ToggleUserFavoriteAction.ACTION_TYPE).pipe(
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

  @Effect({ dispatch: false }) removeFavorite$ = this.actions$.ofType<RemoveUserFavoriteAction>(RemoveUserFavoriteAction.ACTION_TYPE).pipe(
    switchMap((action: RemoveUserFavoriteAction) => {
      const { guid } = action.favorite;
      this.store.dispatch(new RemoveUserFavoriteSuccessAction(action.favorite));
      this.store.dispatch(new PaginationRemoveIdAction(
        guid,
        userFavoritesSchemaKey,
        userFavoritesPaginationKey
      ));
      return this.http.delete<UserFavorite<IFavoriteMetadata>>(`${favoriteUrlPath}/${guid}`);
    })
  );

  @Effect() updateMetadata$ = this.actions$.ofType<UpdateUserFavoriteMetadataAction>(UpdateUserFavoriteMetadataAction.ACTION_TYPE).pipe(
    mergeMap((action: UpdateUserFavoriteMetadataAction) => {
      return this.http.post<UserFavorite<IFavoriteMetadata>>(
        `${favoriteUrlPath}/${action.favorite.guid}/metadata`,
        action.favorite.metadata
      ).pipe(
        map(() => new UpdateUserFavoriteMetadataSuccessAction(action.favorite))
      );
    })
  );
}
