import { inject, Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { distinctUntilChanged, publishReplay, refCount } from 'rxjs/operators';

import { internalEventStateSelector } from '../selectors/internal-events.selectors';
import type { InternalEventsState } from '../types/internal-events.types';
import { InternalEventMonitor } from './internal-event.monitor';
import type { InternalAppState } from '../app-state';

@Injectable()
export class InternalEventMonitorFactory {

  private store = inject(Store<InternalAppState>);
  private ngZone = inject(NgZone);

  private events$: Observable<InternalEventsState> = this.store.select(internalEventStateSelector).pipe(
    distinctUntilChanged(),
    publishReplay(1),
    refCount(),
  );

  getMonitor(eventType: string, subjectIds?: string[] | Observable<string[]>) {
    return new InternalEventMonitor(this.events$, eventType, subjectIds, this.ngZone);
  }

}
