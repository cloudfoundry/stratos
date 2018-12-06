
import { of as observableOf, Observable } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { withLatestFrom, map, filter, distinctUntilChanged } from 'rxjs/operators';

import { endpointSchemaKey } from '../../../../store/helpers/entity-factory';
import { CloudFoundryService } from '../../../data-services/cloud-foundry.service';
import { InternalEventMonitorFactory } from '../../../monitors/internal-event-monitor.factory';
import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';
import { DashboardState } from '../../../../store/reducers/dashboard-reducer';
import { ToggleHeaderEvent } from '../../../../store/actions/dashboard-actions';

@Component({
  selector: 'app-page-header-events',
  templateUrl: './page-header-events.component.html',
  styleUrls: ['./page-header-events.component.scss'],
  animations: [
    trigger(
      'eventEnter', [
        transition(':enter', [
          style({ opacity: 0 }),
          animate('250ms ease-in', style({ opacity: 1 }))
        ]),
        transition(':leave', [
          style({ opacity: 1 }),
          animate('250ms ease-out', style({ opacity: 0 }))
        ])
      ]
    )
  ]
})
export class PageHeaderEventsComponent implements OnInit {
  @Input()
  public endpointIds$: Observable<string[]>;

  public eventMinimized$: Observable<boolean>;
  public errorMessage$: Observable<string>;

  constructor(
    private internalEventMonitorFactory: InternalEventMonitorFactory,
    public cloudFoundryService: CloudFoundryService,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>
  ) {
    this.eventMinimized$ = this.store.select('dashboard').pipe(
      map(dashboardState => dashboardState.headerEventMinimized),
      distinctUntilChanged()
    );
  }

  public toggleEvent() {
    this.store.dispatch(new ToggleHeaderEvent());
  }

  ngOnInit() {
    if (!this.endpointIds$ && this.activatedRoute.snapshot.params && this.activatedRoute.snapshot.params.cfId) {
      this.endpointIds$ = observableOf([this.activatedRoute.snapshot.params.cfId]);
    }
    if (this.endpointIds$) {
      const cfEndpointEventMonitor = this.internalEventMonitorFactory.getMonitor(endpointSchemaKey, this.endpointIds$);
      this.errorMessage$ = cfEndpointEventMonitor.hasErroredOverTime().pipe(
        filter(errors => !!errors && !!errors.length),
        withLatestFrom(this.cloudFoundryService.cFEndpoints$),
        map(([errors, endpoints]) => {
          const endpointString = errors.map(
            id => endpoints.find(endpoint => endpoint.guid === id)
          )
            .map(endpoint => endpoint.name)
            .reduce((message, endpointName, index, { length }) => {
              if (index === 0) {
                return endpointName;
              }
              return index + 1 === length ? `${message} & ${endpointName}` : `${message}, ${endpointName}`;
            }, '');
          return `We've been having trouble communicating with ${endpointString} - You may be seeing out-of-date information`;
        })
      );
    }
  }
}
