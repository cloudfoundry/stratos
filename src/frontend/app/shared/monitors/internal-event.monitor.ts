import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { debounceTime, distinctUntilChanged, filter, map, catchError } from 'rxjs/operators';

import { AppState } from '../../store/app-state';
import { internalEventTypeSelector } from '../../store/selectors/internal-events.selectors';
import { InternalEventServerity, InternalEventSubjectState } from '../../store/types/internal-events.types';

export class InternalEventMonitor {

  public events$: Observable<InternalEventSubjectState>;

  constructor(store: Store<AppState>, eventType: string, subjectIds: string[] | Observable<string[]> = Observable.of(null)) {
    if (Array.isArray(subjectIds)) {
      subjectIds = Observable.of(subjectIds);
    }
    this.events$ = combineLatest(
      store.select(internalEventTypeSelector(eventType)).pipe(distinctUntilChanged(), debounceTime(250)).startWith({}),
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
      }),
      sharedReplay(1),
      refCount()
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
            return event.serverity === InternalEventServerity.ERROR && event.timestamp > time;
          });
          if (hasErrorEvent) {
            array.push(key);
          }
          return array;
        }, []);
      }),
      filter(events => !!events.length);
  }

}
