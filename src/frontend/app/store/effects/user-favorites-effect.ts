import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, switchMap, withLatestFrom, map, tap } from 'rxjs/operators';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';
import { GetUserFavoritesAction, GetUserFavoritesSuccessAction } from '../actions/user-favourites-actions/get-user-favorites-action';
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
            paginationKey: userFavoritesPaginationKey
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
        paginationKey: userFavoritesPaginationKey
      } as PaginatedAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      return this.http.get<UserFavorite<IFavoriteMetadata>[]>(favoriteUrlPath).pipe(
        map(favorites => {
          this.store.dispatch(new GetUserFavoritesSuccessAction(favorites));
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
            this.store.dispatch(new RemoveUserFavoriteAction(action.favorite));
          } else {
            this.store.dispatch(new SaveUserFavoriteAction(action.favorite));
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
