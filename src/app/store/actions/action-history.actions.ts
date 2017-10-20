import { Action } from '@ngrx/store';

export const ActionHistoryActions = {
  DUMP: '[Action History] Dump',
};

export class ActionHistoryDump implements Action {
  type = ActionHistoryActions.DUMP;
}
