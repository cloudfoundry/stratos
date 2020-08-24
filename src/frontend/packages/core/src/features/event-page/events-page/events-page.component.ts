import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { getPreviousRoutingState, AppState } from '@stratosui/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, first, map, share, switchMap, tap } from 'rxjs/operators';

import { GlobalEventService, IGlobalEvent } from '../../../shared/global-events.service';

export const eventReturnUrlParam = 'returnFromEvents';

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
      map(previousState => previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home'),
      map(returnUrl => {
        // Override return url if we've come from the error page
        const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
        return overrideReturnUrl || returnUrl;
      }),
      first(),
    );
  }
  updateReadState(event: IGlobalEvent, read: boolean) {
    this.eventService.updateEventReadState(event, read);
  }

  createQueryParams(urlForward: string): Observable<object> {
    // Ensure we break the looping 'back' we get from Page --> Events --> Errors --> Events --> Errors etc
    return this.back$.pipe(
      map(urlBack => {
        // Pass a url through to the errors page containing the url to return after returning to this page
        const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
        return urlForward && urlForward.startsWith('/errors') ? {
          [eventReturnUrlParam]: overrideReturnUrl || urlBack
        } : {};
      }),
      first(),
    );
  }
}
