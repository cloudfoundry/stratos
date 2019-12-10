import { ActionOrchestrator } from './action-orchestrator';
import { EntityRequestAction } from '../../types/request.types';
import { PaginatedAction } from '../../types/pagination.types';

const BASE_ACTIONS = [
  'get',
  'delete',
  'update',
  'create',
  'getMultiple'
];
const fakeActions = [
  'myMadeUpAction1',
  'myMadeUpAction2'
];

function assertActions(actionOrchestrator: ActionOrchestrator<any>, actionsNotToHave: string[], actionsToHave?: string[]) {
  actionsNotToHave.forEach(action => expect(actionOrchestrator.hasActionBuilder(action)).toBe(false));
  if (actionsToHave) {
    actionsToHave.forEach(action => expect(actionOrchestrator.hasActionBuilder(action)).toBe(true));
  }
}

export function getBaseActionKeys() {
  return [...BASE_ACTIONS];
}

export function hasActions<T extends ActionOrchestrator<any>>(actionOrchestrator: T, expectToHave?: string[]) {
  const baseActions = getBaseActionKeys();
  const baseActionsToNotHave = expectToHave ? getBaseActionKeys().reduce((actions, action) => {
    if (!expectToHave.find((expectAction) => expectAction === action)) {
      actions.push(action);
    }
    return actions;
  }, [] as string[]) : baseActions;
  assertActions(actionOrchestrator, [
    ...baseActionsToNotHave,
    ...fakeActions
  ], expectToHave);
}

export function getRequestAction() {
  return {} as EntityRequestAction;
}

export function getPaginationAction() {
  return {} as PaginatedAction;
}
