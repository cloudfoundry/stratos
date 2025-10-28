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
  return new LeaveZoneScheduler(zone, scheduler);
}

export function enterZone(zone: NgZone, scheduler: SchedulerLike): SchedulerLike {
  return new EnterZoneScheduler(zone, scheduler);
}
