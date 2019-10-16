import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, combineLatest } from 'rxjs';
import { first, map, filter, withLatestFrom } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { getPreviousRoutingState } from '../../../../../store/src/types/routing.type';
import { ActivatedRoute } from '@angular/router';
import { EntityMonitor } from '../../../shared/monitors/entity-monitor';
import { endpointEntitySchema } from '../../../base-entity-schemas';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { InternalEventMonitorFactory } from '../../../shared/monitors/internal-event-monitor.factory';
import { InternalEventState } from '../../../../../store/src/types/internal-events.types';
import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { StratosStatus } from '../../../shared/shared.types';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-events-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss']
})
export class ErrorPageComponent implements OnInit {
  public back$: Observable<string>;
  public errorDetails$: Observable<{ endpoint: EndpointModel; errors: InternalEventState[]; }>;
  public icon = StratosStatus.ERROR;
  public jsonDownloadHref$: Observable<SafeUrl>;
  ngOnInit() {
    const endpointId = this.activatedRoute.snapshot.params.endpointId;
    if (endpointId) {
      const endpointMonitor = new EntityMonitor<EndpointModel>(
        this.store,
        endpointId,
        endpointEntitySchema.key,
        endpointEntitySchema
      );
      const cfEndpointEventMonitor = this.internalEventMonitorFactory.getMonitor(endpointSchemaKey, of([endpointId]));
      this.errorDetails$ = cfEndpointEventMonitor.hasErroredOverTime().pipe(
        withLatestFrom(endpointMonitor.entity$),
        map(([errors, endpoint]) => {
          return {
            endpoint,
            errors: errors[endpointId]
          };
        }),
        first()
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
  }
}
