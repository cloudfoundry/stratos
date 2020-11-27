import { NgZone } from '@angular/core';
import moment from 'moment';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged, map, share, startWith } from 'rxjs/operators';

import {
  InternalEventSeverity,
  InternalEventsState,
  InternalEventState,
  InternalEventSubjectState,
} from '../types/internal-events.types';

export function newNonAngularInterval(ngZone: NgZone, intervalTime: number) {
  return new Observable<number>((observer) => {
    let intervalTimer;
    let counter = 0;
    observer.add(() => {
      clearInterval(intervalTimer);
      counter = 0;
    });
    // Start the interval timer outside of angular
    ngZone.runOutsideAngular(() => {
      intervalTimer = setInterval(() => {
        ngZone.run(() => {
          observer.next(counter);
          counter++;
        });
      }, intervalTime);
    });
  }).pipe(
    share()
  );
}

export class InternalEventMonitor {

  public events$: Observable<InternalEventSubjectState>;

  constructor(
    events$: Observable<InternalEventsState>,
    eventType: string,
    subjectIds: string[] | Observable<string[]> = observableOf(null),
    private ngZone: NgZone,
  ) {
    if (Array.isArray(subjectIds)) {
      subjectIds = observableOf(subjectIds);
    }
    this.events$ = combineLatest(
      events$.pipe(
        map(events => events.types[eventType] || {}),
        distinctUntilChanged()
      ),
      subjectIds
    ).pipe(
      map(([allEvents, ids]) => {
        if (ids === null) {
          return allEvents;
        }
        const events = {} as InternalEventSubjectState;
        ids.forEach(id => {
          if (allEvents[id]) {
            events[id] = allEvents[id];
          }
        });
        return events;
      })
    );
  }

  private getErrorsOverTimePeriod(state: InternalEventSubjectState, minutes: number) {
    const time = moment().subtract(minutes, 'minutes').unix() * 1000;
    return Object.keys(state).reduce<Record<string, InternalEventState[]>>((errorObject, key) => {
      const events = state[key];
      const hasErrorEvent = !!events.find(event => {
        const isError500 = event.eventCode[0] === '5';
        return event.severity === InternalEventSeverity.ERROR && isError500 && event.timestamp > time;
      });
      if (hasErrorEvent) {
        errorObject[key] = events;
      }
      return errorObject;
    }, {});
  }
  public hasErroredOverTime(minutes = 30) {
    const interval$ = newNonAngularInterval(this.ngZone, 30000).pipe(
      startWith(-1)
    );
    return combineLatest(this.events$, interval$).pipe(
      map(([state]) => this.getErrorsOverTimePeriod(state, minutes))
    );
  }

  public hasErroredOverTimeNoPoll(minutes = 30) {
    return this.events$.pipe(
      map(state => this.getErrorsOverTimePeriod(state, minutes))
    );
  }

}
