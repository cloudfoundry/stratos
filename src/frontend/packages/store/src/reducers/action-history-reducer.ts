import { Action } from '@ngrx/store';

export class ActionHistoryState extends Array<string> { }

const maxAge = 100;
const defaultState: ActionHistoryState = [];

export function actionHistoryReducer(state: ActionHistoryState = defaultState, action: Action) {
  // Un-comment this at some point
  // const newState = [...state];
  // let historyItem = action.type;
  // const message = (action as LoggerAction).message;
  // if (message) {
  //   historyItem += ` '${message}'`;
  // }
  // newState.push(historyItem);

  // if (newState.length > maxAge) {
  //   newState.shift();
  // }
  // return newState;
  return state;
}
