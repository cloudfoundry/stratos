import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { endpointEventKey, GlobalEventService, IGlobalEvent } from '../../../global-events.service';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-page-header-events',
  templateUrl: './page-header-events.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderEventsComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private eventService = inject(GlobalEventService);

  public readonly endpointIds = input<string[]>();
  public readonly simpleErrorMessage = input(false);

  endpointId: any;
  // The route's endpoint, set in ngOnInit.
  private readonly routeEndpointId = signal<string | null>(null);
  // The bound ids; without them an endpoint page watches its own endpoint.
  private readonly watchedIds = computed<string[] | undefined>(() => {
    const routeEndpointId = this.routeEndpointId();
    return this.endpointIds() ?? (routeEndpointId ? [routeEndpointId] : undefined);
  });

  // The unread endpoint errors of the endpoints watched.
  private readonly events = computed(() => {
    const endpointIds = this.watchedIds();
    if (!endpointIds) {
      return [];
    }
    return this.eventService.events().filter(event =>
      event.key.startsWith(endpointEventKey) &&
      endpointIds.includes(this.getEndpointId(event)) &&
      !event.read
    );
  });

  public readonly errorMessage = computed(() => {
    const events = this.events();
    if (events.length === 0) {
      return '';
    }
    const endpointErrorKeys = new Set(events.map(event => this.getEndpointId(event)));
    return endpointErrorKeys.size > 1 ? `There are multiple endpoints with errors` : events[0].message;
  });

  // The single underlying event when only one endpoint is in error AND it
  // carries the structured fields (endpointName / endpointId / detail), so
  // the banner can render the endpoint identifier as a title above the
  // error detail. Null for multi-endpoint or legacy events where the
  // structured fields are absent.
  public readonly singleErrorEvent = computed<IGlobalEvent | null>(() => {
    const events = this.events();
    if (events.length === 0) {
      return null;
    }
    const endpointErrorKeys = new Set(events.map(event => this.getEndpointId(event)));
    if (endpointErrorKeys.size !== 1) {
      return null;
    }
    const e = events[0];
    return e.endpointName && e.detail ? e : null;
  });

  public markEventsAsRead() {
    this.events().forEach(event => this.eventService.updateEventReadState(event, true));
  }

  ngOnInit() {
    this.endpointId = this.activatedRoute.snapshot.params && this.activatedRoute.snapshot.params.endpointId ?
      this.activatedRoute.snapshot.params.endpointId : null;
    this.routeEndpointId.set(this.endpointId);
  }

  private getEndpointId(event: IGlobalEvent): string {
    // Prefer the structured field on signal-published events (no link
    // is set — the per-endpoint history page renders empty for
    // signal-only events so the View button is intentionally hidden).
    // Fall back to legacy /errors/{guid} link parsing for ngrx-derived
    // events (endpointEventKey config in app.module).
    if (event.endpointId) return event.endpointId;
    return event.link?.split('/')[2] ?? '';
  }
}
