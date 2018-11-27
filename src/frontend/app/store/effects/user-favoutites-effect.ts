import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap } from 'rxjs/operators';
import { GetUserFavoritesAction } from '../actions/user-favourites-actions/get-user-favorites-action';
import { AppState } from '../app-state';
import { userFavoritesSchemaKey } from '../helpers/entity-factory';
import { IRequestAction, StartRequestAction, WrapperRequestActionSuccess } from '../types/request.types';
import { IUserFavorite } from '../types/user-favorites.types';
import { NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';

@Injectable()
export class UserFavoritesEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  // @Effect() saveFavorite$ = this.actions$.ofType<SaveUserFavoriteAction>(SaveUserFavoriteAction.ACTION_TYPE).pipe(
  //   mergeMap((action: SaveUserFavoriteAction) => {

  //   })
  // );

  @Effect() getFavorite$ = this.actions$.ofType<GetUserFavoritesAction>(GetUserFavoritesAction.ACTION_TYPE).pipe(
    switchMap((action: GetUserFavoritesAction) => {
      const apiAction = {
        entityKey: userFavoritesSchemaKey,
        type: action.type,
        paginationKey: 'userFavorites'
      } as PaginatedAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      const mappedData = {
        entities: {
          [userFavoritesSchemaKey]: {
            '1': {
              guid: '1',
              entityId: '5f0c3b47-2d83-46ba-b70e-bbf7931a8d6e',
              endpointId: 'awFKEYNjCbviKGH4Q1bFdgvCCq0',
              entityType: 'application',
              endpointType: 'cf'
            },
            '1234': {
              guid: '123331',
              entityId: 'awFKEYNjCbviKGH4Q1bFdgvCCq0',
              endpointType: 'cf'
            }
          }
        },
        result: ['1', '1234']
      } as NormalizedResponse<IUserFavorite>;
      return [
        new WrapperRequestActionSuccess(mappedData, apiAction),
      ];
    })
  );
}
