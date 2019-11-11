import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { first, map, switchMap, tap, distinctUntilChanged, share } from 'rxjs/operators';

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
export class EventsPageComponent implements OnInit {
  public unreadEvents$: Observable<IGlobalEvent[]>;
  public readEvents$: Observable<IGlobalEvent[]>;
  public events$: Observable<IGlobalEvent[]>;
  public hasReadEvents$: Observable<boolean>;
  public back$: Observable<string>;
  public filterValues = EventFilterValues;
  public selectedFilter = EventFilterValues.UNREAD;
  public selectedFilterSubject = new BehaviorSubject<EventFilterValues>(this.selectedFilter);

  constructor(
    private eventService: GlobalEventService,
    private store: Store<AppState>
  ) { }

  ngOnInit() {
    this.unreadEvents$ = this.eventService.events$.pipe(
      map(events => events.filter(event => !event.read))
    );
    this.readEvents$ = this.eventService.events$.pipe(
      map(events => events.filter(event => event.read))
    );
    this.events$ = this.selectedFilterSubject.pipe(
      switchMap(filter => {
        switch (filter) {
          case EventFilterValues.READ:
            return this.readEvents$;
          case EventFilterValues.UNREAD:
            return this.unreadEvents$;
          default:
            return this.eventService.events$;
        }
      })
    );
    this.hasReadEvents$ = this.readEvents$.pipe(
      map(events => !!events.length),
      distinctUntilChanged(),
      tap(hasRead => {
        if (!hasRead) {
          this.selectedFilterSubject.next(EventFilterValues.UNREAD);
        }
      }),
      share()
    );
    this.back$ = this.store.select(getPreviousRoutingState).pipe(first()).pipe(
      map(previousState => previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home')
    );
  }
  updateReadState(event: IGlobalEvent, read: boolean) {
    this.eventService.updateEventReadState(event, read);
  }
}
