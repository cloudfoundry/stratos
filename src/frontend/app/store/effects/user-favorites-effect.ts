import { BackendUserFavorite } from './../types/user-favorites.types';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, switchMap, withLatestFrom, map } from 'rxjs/operators';
import { PaginationMonitor } from '../../shared/monitors/pagination-monitor';
import { GetUserFavoritesAction } from '../actions/user-favourites-actions/get-user-favorites-action';
import { SaveUserFavoriteAction } from '../actions/user-favourites-actions/save-user-favorite-action';
import { AppState } from '../app-state';
import { entityFactory, userFavoritesSchemaKey } from '../helpers/entity-factory';
import { NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction, StartRequestAction, WrapperRequestActionSuccess } from '../types/request.types';
import { environment } from '../../../environments/environment';
import { RemoveUserFavoriteAction } from '../actions/user-favourites-actions/remove-user-favorite-action';
import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';

export const userFavoritesPaginationKey = 'userFavorites';

const { proxyAPIVersion } = environment;
const favoriteUrlPath = `/pp/${proxyAPIVersion}/favorites`;
@Injectable()
export class UserFavoritesEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect() saveFavorite$ = this.actions$.ofType<SaveUserFavoriteAction>(SaveUserFavoriteAction.ACTION_TYPE).pipe(
    withLatestFrom(
      new PaginationMonitor<
        UserFavorite<IFavoriteMetadata>
      >(this.store, userFavoritesPaginationKey, entityFactory(userFavoritesSchemaKey)).currentPage$
    ),
    mergeMap(([action, favorites]: [SaveUserFavoriteAction, UserFavorite<IFavoriteMetadata>[]]) => {
      const apiAction = {
        entityKey: userFavoritesSchemaKey,
        type: action.type,
      } as IRequestAction;

      this.store.dispatch(new StartRequestAction(apiAction));

      const {
        entityId,
        endpointId,
        entityType,
        endpointType,
        metadata
      } = action.favorite;

      const favorite = {
        entityId,
        endpointId,
        entityType,
        endpointType,
        metadata: JSON.stringify(metadata)
      } as BackendUserFavorite;

      return this.http.post<UserFavorite<IFavoriteMetadata>>(favoriteUrlPath, action.favorite).pipe(
        mergeMap(newFavorite => {
          const entities = {
            [userFavoritesSchemaKey]: {
              ...favorites.reduce((favObj, favoriteFromArray) => ({
                ...favObj,
                [UserFavoritesEffect.buildFavoriteStoreEntityGuid(favoriteFromArray)]: favoriteFromArray
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
      return this.http.delete<UserFavorite<IFavoriteMetadata>[]>(`${favoriteUrlPath}/${action.guid}`).pipe(
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

  static buildFavoriteStoreEntityGuid(favorite: UserFavorite<IFavoriteMetadata>) {
    const {
      entityId,
      endpointId,
      entityType,
      endpointType,
    } = favorite;
    return [
      entityId,
      endpointId,
      entityType,
      endpointType,
    ]
      .reduce((newArray, value) => {
        if (value) {
          return [
            ...newArray,
            value,
          ];
        }
        return newArray;
      }, [])
      .join('-');
  }
}
