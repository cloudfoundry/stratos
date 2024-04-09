import { NgZone } from '@angular/core';
import { Scheduler, Subscription } from 'rxjs';

class LeaveZoneScheduler {
  constructor(private zone: NgZone, private scheduler: Scheduler) { }

  schedule = (...args: any[]): Subscription => this.zone.runOutsideAngular(() => this.scheduler.schedule.apply(this.scheduler, args));
}

class EnterZoneScheduler {
  constructor(private zone: NgZone, private scheduler: Scheduler) { }

  schedule = (...args: any[]): Subscription => this.zone.run(() => this.scheduler.schedule.apply(this.scheduler, args));
}

export function leaveZone(zone: NgZone, scheduler: Scheduler): Scheduler {
  return new LeaveZoneScheduler(zone, scheduler) as any;
}

export function enterZone(zone: NgZone, scheduler: Scheduler): Scheduler {
  return new EnterZoneScheduler(zone, scheduler) as any;
}
