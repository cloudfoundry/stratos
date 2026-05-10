import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  InternalEventMonitorFactory,
  EndpointModel,
  getPreviousRoutingState,
  StratosStatus,
  endpointEntityType,
  stratosEntityCatalog,
  InternalEventState,
  SendClearEndpointEventsAction,
  AppState,
} from '@stratosui/store';
import { Observable, of } from 'rxjs';
import { take, map, withLatestFrom } from 'rxjs/operators';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPageComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private store = inject<Store<AppState>>(Store);
  private internalEventMonitorFactory = inject(InternalEventMonitorFactory);
  private sanitizer = inject(DomSanitizer);

  public back$: Observable<string>;
  public backParams$: Observable<object>;
  public errorDetails$: Observable<{ endpoint: EndpointModel; errors: InternalEventState[], }>;
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
        map(([errors, endpoint]: [any, EndpointModel]) => {
          return {
            endpoint,
            errors: errors ? errors[endpointId] : null
          };
        })
      );
      this.jsonDownloadHref$ = this.errorDetails$.pipe(
        map((info: any) => {
          const jsonString = JSON.stringify(info);
          return this.sanitizer.bypassSecurityTrustUrl('data:text/json;charset=UTF-8,' + encodeURIComponent(jsonString));
        })
      );
    }
  }

  constructor() {
    const store = this.store;

    this.back$ = store.select(getPreviousRoutingState).pipe(take(1)).pipe(
      map((previousState: any) => previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home')
    );

    this.backParams$ = this.back$.pipe(
      map((urlBack: string) => {
        // If we've come from the events page ensure we pass it back it's param
        const overrideReturnUrl = this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
        return urlBack && urlBack.startsWith('/events') ? {
          [eventReturnUrlParam]: overrideReturnUrl || null
        } : {};
      }),
      take(1)
    );
  }
}
