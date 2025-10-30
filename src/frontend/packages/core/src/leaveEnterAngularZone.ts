import { NgZone } from '@angular/core';
import { SchedulerLike, SchedulerAction, Subscription } from 'rxjs';

class LeaveZoneScheduler implements SchedulerLike {
  constructor(private zone: NgZone, private scheduler: SchedulerLike) { }

  now(): number {
    return this.scheduler.now();
  }

  schedule<T>(
    work: (this: SchedulerAction<T>, state?: T) => void,
    delay?: number,
    state?: T
  ): Subscription {
    return this.zone.runOutsideAngular(() =>
      this.scheduler.schedule(work, delay, state)
    );
  }
}

class EnterZoneScheduler implements SchedulerLike {
  constructor(private zone: NgZone, private scheduler: SchedulerLike) { }

  now(): number {
    return this.scheduler.now();
  }

  schedule<T>(
    work: (this: SchedulerAction<T>, state?: T) => void,
    delay?: number,
    state?: T
  ): Subscription {
    return this.zone.run(() =>
      this.scheduler.schedule(work, delay, state)
    );
  }
}

export function leaveZone(zone: NgZone, scheduler: SchedulerLike): SchedulerLike {
  // Defensive null checks for Angular 20 DI compatibility
  if (!zone) {
    console.warn('leaveZone: NgZone is null or undefined, returning scheduler directly');
    return scheduler;
  }
  if (!scheduler) {
    console.warn('leaveZone: Scheduler is null or undefined');
    throw new Error('leaveZone requires a valid scheduler');
  }
  return new LeaveZoneScheduler(zone, scheduler);
}

export function enterZone(zone: NgZone, scheduler: SchedulerLike): SchedulerLike {
  // Defensive null checks for Angular 20 DI compatibility
  if (!zone) {
    console.warn('enterZone: NgZone is null or undefined, returning scheduler directly');
    return scheduler;
  }
  if (!scheduler) {
    console.warn('enterZone: Scheduler is null or undefined');
    throw new Error('enterZone requires a valid scheduler');
  }
  return new EnterZoneScheduler(zone, scheduler);
}
