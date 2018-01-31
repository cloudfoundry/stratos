import { AppState } from '../app-state';
import { Action } from '@ngrx/store';
import { LoggerAction, LoggerDebugAction } from '../actions/log.actions';

export class ActionHistoryState extends Array<string> { }

const maxAge = 100;
const defaultState: ActionHistoryState = [];

export function actionHistoryReducer(state: ActionHistoryState = defaultState, action: Action) {
  const newState = [...state];
  let historyItem = action.type;
  const message = (action as LoggerAction).message;
  if (message) {
    historyItem += ` '${message}'`;
  }
  newState.push(historyItem);

  if (newState.length > maxAge) {
    newState.shift();
  }
  return newState;
}
