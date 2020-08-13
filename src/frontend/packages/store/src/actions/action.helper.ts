export function getActions(actionClass: string, actionName: string): string[] {
  const action = `[${actionClass}] ${actionName}`;
  const actionSucceeded = `${action} success`;
  const actionFailed = `${action} failed`;
  return [action, actionSucceeded, actionFailed];
}
