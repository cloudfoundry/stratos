import { Action } from '@ngrx/store';

export const SHOW_SNACK_BAR = '[SnackBar] Show';
export const HIDE_SNACK_BAR = '[SnackBar] Hide';

export class ShowSnackBar implements Action {
  constructor(
    public message: string,
    public closeMessage: string = null
  ) {
  }
  type = SHOW_SNACK_BAR;
}

export class HideSnackBar implements Action {
  type = HIDE_SNACK_BAR;
}
