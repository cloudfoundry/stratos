import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CustomTooltipDirective } from '../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AppState, getPreviousRoutingState } from '@stratosui/store';
import { Observable } from 'rxjs';
import { take, distinctUntilChanged, map, share, switchMap, tap } from 'rxjs/operators';

import { GlobalEventService, IGlobalEvent } from '../../../shared/global-events.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatefulIconComponent } from '../../../core/stateful-icon/stateful-icon.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

export const eventReturnUrlParam = 'returnFromEvents';

export enum EventFilterValues {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread'
}

@Component({
  selector: 'app-events-page',
  templateUrl: './events-page.component.html',
  styleUrls: ['./events-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
    CustomTooltipDirective,
    PageHeaderComponent,
    StatefulIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventsPageComponent implements OnInit {
  private eventService = inject(GlobalEventService);
  private store = inject<Store<AppState>>(Store);
  private activatedRoute = inject(ActivatedRoute);

  public unreadEvents$: Observable<IGlobalEvent[]>;
  public readEvents$: Observable<IGlobalEvent[]>;
  public events$: Observable<IGlobalEvent[]>;
  public hasReadEvents$!: Observable<boolean>;
  public back$: Observable<string>;
  public filterValues = EventFilterValues;
  public selectedFilter = EventFilterValues.UNREAD;
  public endpointOnly: boolean;
  private _selectedFilter = signal<EventFilterValues>(this.selectedFilter);
  public selectedFilterSignal = this._selectedFilter.asReadonly();
  public selectedFilterSubject$: Observable<EventFilterValues>;
  constructor() {
    const pathSegment = this.activatedRoute.snapshot.url[0];
    const path = pathSegment ? pathSegment.path : null;
    this.endpointOnly = path === 'endpoints';
    this.selectedFilterSubject$ = toObservable(this._selectedFilter);
  }

  ngOnInit() {
    const events$ = this.eventService.events$.pipe(
      map((events: IGlobalEvent[]) => {
        if (this.endpointOnly) {
          return events.filter((event: IGlobalEvent) => event.key.split('-')[0] === 'endpointError');
        }
        return events;
      })
    );
    this.unreadEvents$ = events$.pipe(
      map((events: IGlobalEvent[]) => events.filter((event: IGlobalEvent) => !event.read))
    );
    this.readEvents$ = events$.pipe(
      map((events: IGlobalEvent[]) => events.filter((event: IGlobalEvent) => event.read))
    );
    this.events$ = this.selectedFilterSubject$.pipe(
      switchMap((filter: EventFilterValues) => {
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
      map((events: IGlobalEvent[]) => !!events.length),
      distinctUntilChanged(),
      tap((hasRead: boolean) => {
        if (!hasRead) {
          this._selectedFilter.set(EventFilterValues.UNREAD);
        }
      }),
      share()
    );
    this.back$ = this.store.select(getPreviousRoutingState).pipe(take(1)).pipe(
      map((previousState: any) => previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home'),
      map((returnUrl: string) => {
        // Override return url if we've come from the error page
        const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
        return overrideReturnUrl || returnUrl;
      }),
      take(1),
    );
  }
  updateReadState(event: IGlobalEvent, read: boolean) {
    this.eventService.updateEventReadState(event, read);
  }

  createQueryParams(urlForward: string): Observable<object> {
    // Ensure we break the looping 'back' we get from Page --> Events --> Errors --> Events --> Errors etc
    return this.back$.pipe(
      map((urlBack: string) => {
        // Pass a url through to the errors page containing the url to return after returning to this page
        const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
        return urlForward && urlForward.startsWith('/errors') ? {
          [eventReturnUrlParam]: overrideReturnUrl || urlBack
        } : {};
      }),
      take(1),
    );
  }
}
