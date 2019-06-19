import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { getPreviousRoutingState } from '../../../../../store/src/types/routing.type';
import { GlobalEventService, IGlobalEvent } from '../../../shared/global-events.service';

@Component({
  selector: 'app-events-page',
  templateUrl: './events-page.component.html',
  styleUrls: ['./events-page.component.scss']
})
export class EventsPageComponent {
  public events$: Observable<IGlobalEvent[]>;
  public back$: Observable<string>;

  constructor(
    eventService: GlobalEventService,
    store: Store<AppState>
  ) {
    this.events$ = eventService.events$;

    this.back$ = store.select(getPreviousRoutingState).pipe(first()).pipe(
      map(previousState => previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home')
    );
  }
}
