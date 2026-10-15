/**
 * The message for a write that ended with no determinable result
 * (writeWithJob status UNKNOWN). It claims neither success nor failure:
 * the operation has stopped and nothing more will come back, so it points
 * at the place that shows what actually happened.
 *
 * `leadIn` names the operation the way the caller's failure message does
 * (e.g. `Delete "my-db"`); `where` names the place the user can see the
 * current state (e.g. "The Services list", "This page").
 */
export function unknownOutcomeMessage(leadIn: string, where: string): string {
  return `${leadIn}: the operation ended, but its result could not be determined. ${where} shows the current state.`;
}
