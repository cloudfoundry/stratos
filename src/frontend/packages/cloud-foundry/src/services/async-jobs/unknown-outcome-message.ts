import { jobTrackingLimitMs } from './write-with-job';

/**
 * Why a write has no known result: it `ended` and nothing can say how, or it
 * was `still-running` in Cloud Foundry when Stratos stopped following it.
 */
export type UnknownHow = 'ended' | 'still-running';

/** How an UNKNOWN write result ended up unknown. */
export const unknownHow = (result: { stillRunning?: boolean }): UnknownHow =>
  result.stillRunning ? 'still-running' : 'ended';

/** A write with no known result, as callers pass it on: `unknown` (ended) or `still-running`. */
export type UnknownOutcome = 'unknown' | 'still-running';

/** The UnknownOutcome of a write result, or undefined when it has one. */
export const unknownOutcomeOf = (result: { status: string; stillRunning?: boolean }): UnknownOutcome | undefined =>
  result.status !== 'UNKNOWN' ? undefined : result.stillRunning ? 'still-running' : 'unknown';

/** How an outcome a caller passed on ended up unknown, or undefined for any other outcome. */
export const unknownHowOf = (outcome: unknown): UnknownHow | undefined =>
  outcome === 'unknown' ? 'ended' : outcome === 'still-running' ? 'still-running' : undefined;

/** e.g. 30 min, 1 h, 1 h 30 min */
export function formatLimit(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : '', m || !h ? `${m} min` : ''].filter(Boolean).join(' ');
}

/**
 * The message for a write with no determinable result (writeWithJob status
 * UNKNOWN). It claims neither success nor failure. It says either that the
 * operation ended and nothing more will come back, or that it is still
 * running in Cloud Foundry and Stratos stopped checking, and it points at
 * the place that shows the current state.
 *
 * `leadIn` names the operation the way the caller's failure message does
 * (e.g. `Delete "my-db"`); `where` names the place the user can see the
 * current state (e.g. "The Services list", "This page").
 */
export function unknownOutcomeMessage(leadIn: string, where: string, how: UnknownHow): string {
  if (how === 'still-running') {
    return `${leadIn}: still running in Cloud Foundry after ${formatLimit(jobTrackingLimitMs())}, `
      + `so Stratos stopped checking on it. ${where} shows its current state.`;
  }
  return `${leadIn}: the operation ended, but its result could not be determined. ${where} shows the current state.`;
}
