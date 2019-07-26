import { Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { distinctUntilChanged, publishReplay, refCount } from 'rxjs/operators';

import { internalEventStateSelector } from '../../../../store/src/selectors/internal-events.selectors';
import { InternalEventsState } from '../../../../store/src/types/internal-events.types';
import { InternalEventMonitor } from './internal-event.monitor';
import { InternalAppState } from '../../../../store/src/app-state';

@Injectable()
export class InternalEventMonitorFactory {

  private events$: Observable<InternalEventsState>;

  constructor(store: Store<InternalAppState>, private ngZone: NgZone) {

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
