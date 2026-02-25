import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { catchError, first, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';

import { EntityDeleteCompleteAction } from '../actions/entity.delete.actions';
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
import { InternalAppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { proxyAPIVersion } from '../jetstream';
import { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { IFavoriteMetadata, UserFavorite, userFavoritesPaginationKey } from '../types/user-favorites.types';
import { UserFavoriteManager } from '../user-favorite-manager';
import { STRATOS_ENDPOINT_TYPE, userFavouritesEntityType } from './../helpers/stratos-entity-factory';

const favoriteUrlPath = `/pp/${proxyAPIVersion}/favorites`;

@Injectable()
export class UserFavoritesEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<InternalAppState>,
    private userFavoriteManager: UserFavoriteManager
  ) {
  }

   saveFavorite = createEffect(() => this.actions$.pipe(
    ofType<SaveUserFavoriteAction>(SaveUserFavoriteAction.ACTION_TYPE),
    mergeMap((action): Observable<any> | any[] => {
      // Defensive: Validate action payload before processing
      if (!action?.favorite) {
        console.error('Save favorite error: action.favorite is null or undefined', { action });
        return [];
      }

      if (!action.favorite.getPayload) {
        console.error('Save favorite error: action.favorite.getPayload is not a function', { favorite: action.favorite });
        return [];
      }

      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http.post<UserFavorite<IFavoriteMetadata>>(favoriteUrlPath, action.favorite.getPayload()).pipe(
        switchMap((newFavorite): any[] => {
          this.store.dispatch(new WrapperRequestActionSuccess(null, action, actionType));
          this.store.dispatch(new SaveUserFavoriteSuccessAction(newFavorite));
          return [];
        }),
        catchError((error): any[] => {
          let errorMessage = 'Failed to save user favorite';

          // Defensive: Check error object exists and has expected properties
          const errorStatus = error?.status;
          const errorMsg = error?.message;

          // Provide more specific error messages based on HTTP status
          if (errorStatus === 400) {
            errorMessage = 'Invalid favorite data. Missing required fields.';
          } else if (errorStatus === 500) {
            errorMessage = 'Server error saving favorite. Please try again.';
          }

          // Defensive: Safe logging with null checks
          console.error('Save favorite error:', {
            favorite: action?.favorite,
            status: errorStatus || 'unknown',
            message: errorMsg || 'unknown',
            error
          });

          this.store.dispatch(new WrapperRequestActionFailed(errorMessage, action, actionType));
          return [];
        })
      );
    })
  ));

   getFavorite$ = createEffect(() => this.actions$.pipe(
    ofType<GetUserFavoritesAction>(GetUserFavoritesAction.ACTION_TYPE),
    switchMap((action: GetUserFavoritesAction) => {
      const favEntityKey = entityCatalog.getEntityKey(action);
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http.get<UserFavorite<IFavoriteMetadata>[]>(favoriteUrlPath).pipe(
        switchMap((favorites): any[] => {
          const mappedData = favorites.reduce<NormalizedResponse<UserFavorite<IFavoriteMetadata>>>((data, favorite) => {
            const { guid } = favorite;
            if (guid) {
              data.entities[favEntityKey][guid] = favorite;
              data.result.push(guid);
            }
            return data;
          }, { entities: { [favEntityKey]: {} }, result: [] });
          this.store.dispatch(new WrapperRequestActionSuccess(mappedData, action, actionType, mappedData.result.length, 1));
          this.store.dispatch(new GetUserFavoritesSuccessAction(favorites));
          return [];
        }),
        catchError((): any[] => {
          this.store.dispatch(new GetUserFavoritesFailedAction());
          this.store.dispatch(new WrapperRequestActionFailed('Failed to fetch user favorites', action, actionType));
          return [];
        })
      );
    })
  ), { dispatch: false });

   toggleFavorite = createEffect(() => this.actions$.pipe(
    ofType<ToggleUserFavoriteAction>(ToggleUserFavoriteAction.ACTION_TYPE),
    mergeMap((action): Observable<any> | any[] => {
      // Defensive: Validate action payload before processing
      if (!action?.favorite) {
        console.error('Toggle favorite error: action.favorite is null or undefined', { action });
        return [];
      }

      return this.userFavoriteManager.getIsFavoriteObservable(action.favorite).pipe(
        first(),
        switchMap(isFav => {
          if (isFav) {
            return [new RemoveUserFavoriteAction(action.favorite)];
          } else {
            return [new SaveUserFavoriteAction(action.favorite)];
          }
        }),
        catchError((error): any[] => {
          // Defensive: Handle errors in toggle operation
          console.error('Toggle favorite error:', {
            favorite: action?.favorite,
            error
          });
          return [];
        })
      );
    })
  ));

   removeFavorite$ = createEffect(() => this.actions$.pipe(
    ofType<RemoveUserFavoriteAction>(RemoveUserFavoriteAction.ACTION_TYPE),
    mergeMap((action: RemoveUserFavoriteAction): Observable<any> | any[] => {
      // Defensive: Validate action payload before processing
      if (!action?.guid) {
        console.error('Remove favorite error: action.guid is null or undefined', { action });
        return [];
      }

      if (!action?.favorite) {
        console.error('Remove favorite error: action.favorite is null or undefined', { action });
        return [];
      }

      if (!action?.entity || !Array.isArray(action.entity) || action.entity.length === 0) {
        console.error('Remove favorite error: action.entity is invalid', { action });
        return [];
      }

      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http.delete<UserFavorite<IFavoriteMetadata>>(`${favoriteUrlPath}/${action.guid}`).pipe(
        switchMap((): any[] => {
          this.store.dispatch(new WrapperRequestActionSuccess(null, action));
          this.store.dispatch(new RemoveUserFavoriteSuccessAction(action.favorite));
          this.store.dispatch(new ClearPaginationOfEntity(action.entity[0], action.guid, userFavoritesPaginationKey));
          return [];
        }),
        catchError((error): any[] => {
          // Defensive: Log error details for debugging
          console.error('Remove favorite error:', {
            guid: action?.guid,
            error
          });
          this.store.dispatch(new WrapperRequestActionFailed('Failed to remove user favorite', action, actionType));
          return [];
        })
      );
    })
  ), { dispatch: false });

   updateMetadata$ = createEffect(() => this.actions$.pipe(
    ofType<UpdateUserFavoriteMetadataAction>(UpdateUserFavoriteMetadataAction.ACTION_TYPE),
    mergeMap((action: UpdateUserFavoriteMetadataAction): Observable<any> | any[] => {
      // Defensive: Validate action payload before processing
      if (!action?.favorite) {
        console.error('Update favorite metadata error: action.favorite is null or undefined', { action });
        return [];
      }

      if (!action.favorite.guid) {
        console.error('Update favorite metadata error: action.favorite.guid is null or undefined', { favorite: action.favorite });
        return [];
      }

      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http.post<UserFavorite<IFavoriteMetadata>>(
        `${favoriteUrlPath}/${action.favorite.guid}/metadata`,
        action.favorite.metadata
      ).pipe(
        switchMap((): any[] => {
          this.store.dispatch(new WrapperRequestActionSuccess(null, action));
          this.store.dispatch(new UpdateUserFavoriteMetadataSuccessAction(action.favorite));
          return [];
        }),
        catchError((error): any[] => {
          let errorMessage = 'Failed to update user favorite metadata';

          // Defensive: Check error object exists and has expected properties
          const errorStatus = error?.status;
          const errorMsg = error?.message;

          // Provide more specific error messages based on HTTP status
          if (errorStatus === 404) {
            errorMessage = 'Favorite not found. It may have been deleted or never created.';
          } else if (errorStatus === 400) {
            errorMessage = 'Invalid favorite metadata format';
          } else if (errorStatus === 500) {
            errorMessage = 'Server error updating favorite. Please try again.';
          }

          // Defensive: Safe logging with null checks
          console.error('Update favorite metadata error:', {
            guid: action?.favorite?.guid || 'unknown',
            status: errorStatus || 'unknown',
            message: errorMsg || 'unknown',
            error
          });

          this.store.dispatch(new WrapperRequestActionFailed(errorMessage, action, actionType));
          return [];
        })
      );
    })
  ));


  entityDeleteRequest$ = createEffect(() => this.actions$.pipe(
    ofType<EntityDeleteCompleteAction>(EntityDeleteCompleteAction.ACTION_TYPE),
    withLatestFrom(this.store),
    mergeMap(([action, appState]): any[] => {
      // Defensive: Validate action exists
      if (!action) {
        console.error('Entity delete request error: action is null or undefined');
        return [];
      }

      // Defensive: Verify asFavorite method exists
      if (!action.asFavorite || typeof action.asFavorite !== 'function') {
        console.error('Entity delete request error: action.asFavorite is not a function', { action });
        return [];
      }

      // If there is a favorite, delete it
      const fav = action.asFavorite();

      // Defensive: Validate favorite has guid
      if (!fav?.guid) {
        console.error('Entity delete request error: favorite guid is null or undefined', { favorite: fav });
        return [];
      }

      const entityKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, userFavouritesEntityType);

      // Defensive: Check appState structure before accessing nested properties
      if (appState?.requestData?.[entityKey]?.[fav.guid]) {
        this.store.dispatch(new RemoveUserFavoriteAction(fav));
      }
      return [];
    })
  ));

}
