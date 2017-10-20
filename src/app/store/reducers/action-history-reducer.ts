import { AppState } from '../app-state';
import { Action } from '@ngrx/store';

export class ActionHistoryState extends Array<string> { }

const maxAge = 100;
const defaultState: ActionHistoryState = [];

export function actionHistoryReducer(state: ActionHistoryState = defaultState, action: Action) {
  const newState = [...state];
  newState.push(action.type);
  if (newState.length > maxAge) {
    newState.shift();
  }
  return newState;
}
