import { Action } from '@ngrx/store';
export const SHOW_SNACK_BAR = '[SnackBar] Show';
export const SHOW_HIDE = '[SnackBar] Hide';

export class ShowSnackBar implements Action {
  constructor(public message) {
  }
  type = SHOW_SNACK_BAR;
}
