import { Action } from '@ngrx/store';

export class BaseUserFavoritesAction implements Action {
  constructor(
    actionType: string,
  ) {
    this.type = actionType;
  }
  public type: string;
  public url = '/user-favorites';
}
