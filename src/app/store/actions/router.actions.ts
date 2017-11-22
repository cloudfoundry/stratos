import { Action } from '@ngrx/store';
import { Router } from '@angular/router';

export const RouterActions = {
  GO: '[Router] Go To',
};

export class GoToState implements Action {
  type = RouterActions.GO;
  constructor(public url: string) { }
}
