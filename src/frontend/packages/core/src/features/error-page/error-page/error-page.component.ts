import { ChangeDetectionStrategy, Component, Injector, OnInit, computed, inject, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
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
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

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
export class ErrorPageComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private routingHistory = inject(RoutingHistoryService);
  private errorEvents = inject(EndpointErrorEventsService);
  private sanitizer = inject(DomSanitizer);
  private endpointsData = inject(EndpointsDataService);
  private injector = inject(Injector);

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
  // strict: only assigned in ngOnInit when an endpointId route param is present; left
  // undefined otherwise. The template guards via `@if (errorDetails$ | async; as ...)`
  // and the async pipe tolerates an undefined source.
  public errorDetails$?: Observable<{ endpoint: EndpointModel | null; errors: InternalEventState[], }>;
  public icon = StratosStatus.ERROR;
  public jsonDownloadHref$?: Observable<SafeUrl>;

  // The endpoint may not have resolved yet (guid optional on EndpointModel).
  public dismissEndpointErrors(endpointGuid: string | undefined) {
    if (!endpointGuid) {
      return;
    }
    this.errorEvents.clearEndpoint(endpointGuid);
  }

  ngOnInit() {
    const endpointId = this.activatedRoute.snapshot.params.endpointId;
    if (endpointId) {
      // W36-B Wave 3: read endpoint via EndpointsDataService signal
      // bridge instead of legacy EntityMonitor.entity$.
      const endpoint$ = toObservable(
        this.endpointsData.endpointById(endpointId),
        { injector: this.injector },
      );
      // Read per-endpoint error history from the signal-native error bus,
      // filtered to backend (5xx) errors in the last 30 minutes — preserving
      // the old InternalEventMonitor.hasErroredOverTimeNoPoll(30) behaviour.
      const errorsSig = this.errorEvents.errorsForEndpoint(endpointId);
      const errors$ = toObservable(
        computed(() => {
          const cutoff = Date.now() - 30 * 60 * 1000;
          return errorsSig().filter(e => e.eventCode?.[0] === '5' && (e.timestamp ?? 0) > cutoff);
        }),
        { injector: this.injector },
      );
      this.errorDetails$ = combineLatest([errors$, endpoint$]).pipe(
        map(([errors, endpoint]: [InternalEventState[], EndpointModel | null]) => ({ endpoint, errors }))
      );
      this.jsonDownloadHref$ = this.errorDetails$.pipe(
        map((info: any) => {
          const jsonString = JSON.stringify(info);
          return this.sanitizer.bypassSecurityTrustUrl('data:text/json;charset=UTF-8,' + encodeURIComponent(jsonString));
        })
      );
    }
  }
}
