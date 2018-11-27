import { Action } from '@ngrx/store';

export type BaseUserFavoritesHttpMethods = 'get' | 'delete' | 'put';

export class BaseUserFavoritesAction implements Action {
  constructor(
    actionType: string,
    public favoriteType: string,
    public httpMethod: BaseUserFavoritesHttpMethods
  ) {
    this.type = actionType;
  }
  public type: string;
  public url = '/user-favorites';
}
