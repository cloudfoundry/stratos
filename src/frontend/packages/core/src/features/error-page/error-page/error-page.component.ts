import { ChangeDetectionStrategy, Component, computed, inject, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UrlPartsPipe } from '../../../shared/pipes/url-parts.pipe';
import {
  EndpointModel,
  EndpointsDataService,
  EndpointErrorEventsService,
  RoutingHistoryService,
  StratosStatus,
  InternalEventState,
} from '@stratosui/store';

import { eventReturnUrlParam } from '../../event-page/events-page/events-page.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CardWrapperComponent } from '../../../shared/components/cards/card/card.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    CardWrapperComponent,
    CustomIconComponent,
    UrlPartsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPageComponent {
  private activatedRoute = inject(ActivatedRoute);
  private routingHistory = inject(RoutingHistoryService);
  private errorEvents = inject(EndpointErrorEventsService);
  private sanitizer = inject(DomSanitizer);
  private endpointsData = inject(EndpointsDataService);

  // The page before this one, read once at the first render (by then the
  // navigation here is recorded). Untracked, so later navigations from this
  // page do not move the Close link.
  private readonly previousState = computed(() => untracked(this.routingHistory.previousState));

  public readonly back = computed(() => {
    const previousState = this.previousState();
    return previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home';
  });

  // If we've come from the events page ensure we pass it back its param
  public readonly backParams = computed(() => {
    const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
    return this.back().startsWith('/events') ? { [eventReturnUrlParam]: overrideReturnUrl || null } : {};
  });
  private readonly endpointId: string | undefined = this.activatedRoute.snapshot.params.endpointId;
  private readonly endpoint = this.endpointId ? this.endpointsData.endpointById(this.endpointId) : null;
  // Per-endpoint error history from the signal-native error bus, filtered to
  // backend (5xx) errors in the last 30 minutes — preserving the old
  // InternalEventMonitor.hasErroredOverTimeNoPoll(30) behaviour. The cutoff is
  // taken when the history changes, not as time passes.
  private readonly recentErrors = this.endpointId ? this.errorEvents.errorsForEndpoint(this.endpointId) : null;
  // Null (nothing to show) unless the route names an endpoint.
  public readonly errorDetails = computed<{ endpoint: EndpointModel | null; errors: InternalEventState[], } | null>(() => {
    if (!this.endpoint || !this.recentErrors) {
      return null;
    }
    const cutoff = Date.now() - 30 * 60 * 1000;
    return {
      endpoint: this.endpoint(),
      errors: this.recentErrors().filter(e => e.eventCode?.[0] === '5' && (e.timestamp ?? 0) > cutoff),
    };
  });
  public icon = StratosStatus.ERROR;
  public readonly jsonDownloadHref = computed<SafeUrl | null>(() => {
    const info = this.errorDetails();
    return info
      ? this.sanitizer.bypassSecurityTrustUrl('data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(info)))
      : null;
  });

  // The endpoint may not have resolved yet (guid optional on EndpointModel).
  public dismissEndpointErrors(endpointGuid: string | undefined) {
    if (!endpointGuid) {
      return;
    }
    this.errorEvents.clearEndpoint(endpointGuid);
  }
}
