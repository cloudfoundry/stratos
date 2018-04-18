import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { withLatestFrom, map, filter } from 'rxjs/operators';

import { endpointSchemaKey } from '../../../../store/helpers/entity-factory';
import { CloudFoundryService } from '../../../data-services/cloud-foundry.service';
import { InternalEventMonitorFactory } from '../../../monitors/internal-event-monitor.factory';

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
  @Input('endpointIds$')
  public endpointIds$: Observable<string[]>;

  public errorMessage$: Observable<string>;

  constructor(
    private internalEventMonitorFactory: InternalEventMonitorFactory,
    public cloudFoundryService: CloudFoundryService,
    private activatedRoute: ActivatedRoute
  ) { }

  private searchEventsForErrors(events) {
    const index = Math.round(events.length / 2);
  }
  private checkIndex(events, index) {
    const event = events[index];
  }
  ngOnInit() {
    if (!this.endpointIds$ && this.activatedRoute.snapshot.params.cfId) {
      this.endpointIds$ = Observable.of([this.activatedRoute.snapshot.params.cfId])
    }
    if (this.endpointIds$) {
      const cfEndpointEventMonitor = this.internalEventMonitorFactory.getMonitor(endpointSchemaKey, this.endpointIds$);
      this.errorMessage$ = cfEndpointEventMonitor.hasErroredOverTime().pipe(
        filter(errors => errors && !!Object.keys(errors)),
        withLatestFrom(this.cloudFoundryService.cFEndpoints$),
        map(([errors, endpoints]) => {
          const endpointString = errors.map(
            id => endpoints.find(endpoint => endpoint.guid === id)
          )
            .map(endpoint => endpoint.name)
            .join(' & ');
          return `We've encountered errors with ${endpointString}`;
        })
      );
    }
  }
}
