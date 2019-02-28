import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, publishReplay, refCount, tap } from 'rxjs/operators';

import { InternalEventMonitor } from './internal-event.monitor';
import { Injectable, NgZone } from '@angular/core';
import { InternalEventsState } from '../../../../store/src/types/internal-events.types';
import { AppState } from '../../../../store/src/app-state';
import { internalEventStateSelector } from '../../../../store/src/selectors/internal-events.selectors';
@Injectable()
export class InternalEventMonitorFactory {

  private events$: Observable<InternalEventsState>;

  constructor(private store: Store<AppState>, private ngZone: NgZone) {

    this.events$ = store.select(internalEventStateSelector).pipe(
      distinctUntilChanged(),
      publishReplay(1),
      refCount(),
    );
  }

  getMonitor(eventType: string, subjectIds?: string[] | Observable<string[]>) {
    return new InternalEventMonitor(this.events$, eventType, subjectIds, this.ngZone);
  }

}
