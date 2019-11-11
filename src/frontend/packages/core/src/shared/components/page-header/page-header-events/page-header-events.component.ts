import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { endpointSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { endpointListKey, EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { endpointEntitySchema } from '../../../../base-entity-schemas';
import { InternalEventMonitorFactory } from '../../../monitors/internal-event-monitor.factory';
import { PaginationMonitor } from '../../../monitors/pagination-monitor';
import { SendClearEndpointEventsAction } from '../../../../../../store/src/actions/internal-events.actions';


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
  @Input()
  public simpleErrorMessage = false;

  public errorMessage$: Observable<string>;
  endpointId: any;

  constructor(
    private internalEventMonitorFactory: InternalEventMonitorFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<CFAppState>
  ) { }

  public dismissEndpointErrors(endpointGuid: string) {
    this.store.dispatch(new SendClearEndpointEventsAction(endpointGuid));
  }

  ngOnInit() {
    this.endpointId = this.activatedRoute.snapshot.params && this.activatedRoute.snapshot.params.endpointId ?
      this.activatedRoute.snapshot.params.endpointId : null;
    if (!this.endpointIds$ && this.endpointId) {
      this.endpointIds$ = observableOf([this.endpointId]);
    }
    if (this.endpointIds$) {
      const endpointMonitor = new PaginationMonitor<EndpointModel>(
        this.store,
        endpointListKey,
        endpointEntitySchema
      );
      const cfEndpointEventMonitor = this.internalEventMonitorFactory.getMonitor(endpointSchemaKey, this.endpointIds$);
      this.errorMessage$ = combineLatest(
        cfEndpointEventMonitor.hasErroredOverTime(),
        endpointMonitor.currentPage$
      ).pipe(
        map(([errors, endpoints]) => {
          const keys = errors ? Object.keys(errors) : null;
          if (!keys || !keys.length) {
            return null;
          }
          console.log(keys);
          const endpointString = keys
            .map(id => endpoints.find(endpoint => {
              return endpoint.guid === id;
            }))
            .reduce((message, endpoint, index, { length }) => {
              const endpointName = endpoint.name;
              if (index === 0) {
                return endpointName;
              }
              return index + 1 === length ? `${message} & ${endpointName}` : `${message}, ${endpointName}`;
            }, '');
          return `We've been having trouble communicating with ${endpointString}`;
        })
      );
    }
  }
}
