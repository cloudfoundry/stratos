import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { first, map, switchMap, tap, distinctUntilChanged, share } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { getPreviousRoutingState } from '../../../../../store/src/types/routing.type';
import { GlobalEventService, IGlobalEvent } from '../../../shared/global-events.service';
import { ActivatedRoute, UrlSegment } from '@angular/router';

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
  public endpointOnly: boolean;
  public selectedFilterSubject = new BehaviorSubject<EventFilterValues>(this.selectedFilter);
  constructor(
    private eventService: GlobalEventService,
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute
  ) {
    const pathSegment = this.activatedRoute.snapshot.url[0];
    const path = pathSegment ? pathSegment.path : null;
    this.endpointOnly = path === 'endpoints';
  }

  ngOnInit() {
    const events$ = this.eventService.events$.pipe(
      map(events => {
        if (this.endpointOnly) {
          return events.filter(event => event.key.split('-')[0] === 'endpointError');
        }
        return events;
      })
    );
    this.unreadEvents$ = events$.pipe(
      map(events => events.filter(event => !event.read))
    );
    this.readEvents$ = events$.pipe(
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
            return events$;
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
