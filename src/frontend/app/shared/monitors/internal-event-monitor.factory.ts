import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { debounceTime, distinctUntilChanged, publishReplay, refCount, tap } from 'rxjs/operators';

import { AppState } from '../../store/app-state';
import { internalEventStateSelector } from '../../store/selectors/internal-events.selectors';
import { InternalEventSubjectState } from '../../store/types/internal-events.types';
import { InternalEventMonitor } from './internal-event.monitor';
import { Injectable } from '@angular/core';
@Injectable()
export class InternalEventMonitorFactory {

  private events$: Observable<InternalEventSubjectState>;

  constructor(private store: Store<AppState>) {

    this.events$ = store.select(internalEventStateSelector).pipe(
      distinctUntilChanged(),
      publishReplay(1),
      refCount(),
    );
  }

  getMonitor(eventType: string, subjectIds?: string[] | Observable<string[]>) {
    return new InternalEventMonitor(this.events$, eventType, subjectIds);
  }

}
