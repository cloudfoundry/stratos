import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { first, map, withLatestFrom } from 'rxjs/operators';

import { SendClearEndpointEventsAction } from '../../../../../store/src/actions/internal-events.actions';
import { AppState } from '../../../../../store/src/app-state';
import { endpointEntityType } from '../../../../../store/src/helpers/stratos-entity-factory';
import { InternalEventMonitorFactory } from '../../../../../store/src/monitors/internal-event-monitor.factory';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { InternalEventState } from '../../../../../store/src/types/internal-events.types';
import { getPreviousRoutingState } from '../../../../../store/src/types/routing.type';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import { eventReturnUrlParam } from '../../event-page/events-page/events-page.component';

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss']
})
export class ErrorPageComponent implements OnInit {
  public back$: Observable<string>;
  public backParams$: Observable<object>;
  public errorDetails$: Observable<{ endpoint: EndpointModel; errors: InternalEventState[]; }>;
  public icon = StratosStatus.ERROR;
  public jsonDownloadHref$: Observable<SafeUrl>;

  public dismissEndpointErrors(endpointGuid: string) {
    this.store.dispatch(new SendClearEndpointEventsAction(endpointGuid));
  }

  ngOnInit() {
    const endpointId = this.activatedRoute.snapshot.params.endpointId;
    if (endpointId) {
      const endpointMonitor = stratosEntityCatalog.endpoint.store.getEntityMonitor(endpointId);
      const cfEndpointEventMonitor = this.internalEventMonitorFactory.getMonitor(endpointEntityType, of([endpointId]));
      this.errorDetails$ = cfEndpointEventMonitor.hasErroredOverTimeNoPoll(30).pipe(
        withLatestFrom(endpointMonitor.entity$),
        map(([errors, endpoint]) => {
          return {
            endpoint,
            errors: errors ? errors[endpointId] : null
          };
        })
      );
      this.jsonDownloadHref$ = this.errorDetails$.pipe(
        map((info) => {
          const jsonString = JSON.stringify(info);
          return this.sanitizer.bypassSecurityTrustUrl('data:text/json;charset=UTF-8,' + encodeURIComponent(jsonString));
        })
      );
    }
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private internalEventMonitorFactory: InternalEventMonitorFactory,
    private sanitizer: DomSanitizer
  ) {
    this.back$ = store.select(getPreviousRoutingState).pipe(first()).pipe(
      map(previousState => previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home')
    );

    this.backParams$ = this.back$.pipe(
      map(urlBack => {
        // If we've come from the events page ensure we pass it back it's param
        const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
        return urlBack && urlBack.startsWith('/events') ? {
          [eventReturnUrlParam]: overrideReturnUrl || null
        } : {};
      }),
      first()
    );
  }
}
