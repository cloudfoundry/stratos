import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CustomTooltipDirective } from '../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { RoutingHistoryService } from '@stratosui/store';

import { GlobalEventService, IGlobalEvent } from '../../../shared/global-events.service';
import { CardWrapperComponent } from '../../../shared/components/cards/card/card.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
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
    CardWrapperComponent,
    CustomIconComponent,
    CustomTooltipDirective,
    PageHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventsPageComponent {
  private eventService = inject(GlobalEventService);
  private routingHistory = inject(RoutingHistoryService);
  private activatedRoute = inject(ActivatedRoute);

  public filterValues = EventFilterValues;
  public endpointOnly: boolean;
  private _selectedFilter = signal<EventFilterValues>(EventFilterValues.UNREAD);
  public selectedFilterSignal = this._selectedFilter.asReadonly();

  private readonly allEvents = computed(() => {
    const events = this.eventService.events();
    return this.endpointOnly ? events.filter(event => event.key.split('-')[0] === 'endpointError') : events;
  });
  private readonly unreadEvents = computed(() => this.allEvents().filter(event => !event.read));
  private readonly readEvents = computed(() => this.allEvents().filter(event => event.read));
  public readonly hasReadEvents = computed(() => !!this.readEvents().length);

  public readonly events = computed(() => {
    switch (this._selectedFilter()) {
      case EventFilterValues.READ:
        return this.readEvents();
      case EventFilterValues.UNREAD:
        return this.unreadEvents();
      default:
        return this.allEvents();
    }
  });

  // The page before this one, read once at the first render (by then the
  // navigation here is recorded). Untracked, so later navigations from this
  // page do not move the Close link.
  private readonly previousState = computed(() => untracked(this.routingHistory.previousState));

  public readonly back = computed(() => {
    const previousState = this.previousState();
    const returnUrl = previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home';
    // Override return url if we've come from the error page
    const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
    return overrideReturnUrl || returnUrl;
  });

  constructor() {
    const pathSegment = this.activatedRoute.snapshot.url[0];
    const path = pathSegment ? pathSegment.path : null;
    this.endpointOnly = path === 'endpoints';

    // With nothing read, only the unread filter makes sense.
    effect(() => {
      if (!this.hasReadEvents()) {
        this._selectedFilter.set(EventFilterValues.UNREAD);
      }
    });
  }

  updateReadState(event: IGlobalEvent, read: boolean) {
    this.eventService.updateEventReadState(event, read);
  }

  // Filter selector, wired from the toolbar buttons.
  selectFilter(value: EventFilterValues) {
    this._selectedFilter.set(value);
  }

  createQueryParams(urlForward: string): object {
    // Ensure we break the looping 'back' we get from Page --> Events --> Errors --> Events --> Errors etc
    // Pass a url through to the errors page containing the url to return after returning to this page
    const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
    return urlForward && urlForward.startsWith('/errors') ? {
      [eventReturnUrlParam]: overrideReturnUrl || this.back()
    } : {};
  }
}
