import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { getPreviousRoutingState } from '../../../../../store/src/types/routing.type';
import { GlobalEventService, IGlobalEvent } from '../../../shared/global-events.service';

export enum EventFilterValues {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread'
}

@Component({
  selector: 'app-events-page',
  templateUrl: './events-page.component.html',
  styleUrls: ['./events-page.component.scss']
})
export class EventsPageComponent {
  public events$: Observable<IGlobalEvent[]>;
  public back$: Observable<string>;
  public filterValues = EventFilterValues;
  public selectedFilter = EventFilterValues.ALL;
  public selectedFilterSubject = new BehaviorSubject<EventFilterValues>(this.selectedFilter);

  constructor(
    private eventService: GlobalEventService,
    store: Store<AppState>
  ) {
    this.events$ = combineLatest([
      eventService.events$,
      this.selectedFilterSubject.asObservable()
    ]).pipe(
      map(([allEvents, filter]: [IGlobalEvent[], EventFilterValues]) => {
        return allEvents.filter(event => {
          if (filter === EventFilterValues.ALL) {
            return true;
          } else if (event.read && filter === EventFilterValues.READ) {
            return true;
          } else if (!event.read && filter === EventFilterValues.UNREAD) {
            return true;
          }
          return false;
        });
      })
    );

    this.back$ = store.select(getPreviousRoutingState).pipe(first()).pipe(
      map(previousState => previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home')
    );
  }

  updateReadState(event: IGlobalEvent, read: boolean) {
    this.eventService.updateEventReadState(event, read);
  }
}
