import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { filter, map } from 'rxjs/operators';

import { InternalEventSeverity, InternalEventSubjectState } from '../../store/types/internal-events.types';

export class InternalEventMonitor {

  public events$: Observable<InternalEventSubjectState>;

  constructor(
    events$: Observable<InternalEventSubjectState>,
    eventType: string,
    subjectIds: string[] | Observable<string[]> = Observable.of(null)
  ) {
    if (Array.isArray(subjectIds)) {
      subjectIds = Observable.of(subjectIds);
    }
    this.events$ = combineLatest(
      events$.pipe(
        map(events => events.types[eventType] || {})
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

  public hasErroredOverTime(minutes = 5) {
    const interval$ = new IntervalObservable(30000).startWith(-1);
    return combineLatest(this.events$, interval$).pipe(
      filter(([state]) => !!Object.keys(state).length),
      map(([state]) => {
        const time = moment().subtract(minutes, 'minutes').unix() * 1000;
        return Object.keys(state).reduce<string[]>((array, key) => {
          const events = state[key];
          const hasErrorEvent = !!events.find(event => {
            return event.severity === InternalEventSeverity.ERROR && event.timestamp > time;
          });
          if (hasErrorEvent) {
            array.push(key);
          }
          return array;
        }, []);
      }),
      filter(events => !!events.length)
    );
  }

}
