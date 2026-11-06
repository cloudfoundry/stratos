/**
 * Zoneless Migration: Zone.js-free scheduler utilities
 *
 * In zoneless mode (Angular 20+), there is no NgZone, so zone-related
 * scheduler operations are pass-through. These functions maintain API
 * compatibility while operating in a zoneless environment.
 */
import { SchedulerLike } from 'rxjs';

/**
 * Pass-through function for zoneless mode.
 * In zone-based apps, this would run work outside Angular's zone.
 * In zoneless mode, schedulers run normally without zone context.
 *
 * @param _zone Ignored in zoneless mode (kept for API compatibility)
 * @param scheduler The scheduler to use
 * @returns The scheduler unchanged (no zone wrapping needed)
 */
export function leaveZone(_zone: any, scheduler: SchedulerLike): SchedulerLike {
  if (!scheduler) {
    throw new Error('leaveZone requires a valid scheduler');
  }
  // In zoneless mode, just return the scheduler directly
  return scheduler;
}

/**
 * Pass-through function for zoneless mode.
 * In zone-based apps, this would run work inside Angular's zone.
 * In zoneless mode, schedulers run normally without zone context.
 *
 * @param _zone Ignored in zoneless mode (kept for API compatibility)
 * @param scheduler The scheduler to use
 * @returns The scheduler unchanged (no zone wrapping needed)
 */
export function enterZone(_zone: any, scheduler: SchedulerLike): SchedulerLike {
  if (!scheduler) {
    throw new Error('enterZone requires a valid scheduler');
  }
  // In zoneless mode, just return the scheduler directly
  return scheduler;
}
