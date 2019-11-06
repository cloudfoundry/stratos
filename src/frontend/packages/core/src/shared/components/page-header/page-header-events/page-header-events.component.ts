import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { ToggleHeaderEvent } from '../../../../../../store/src/actions/dashboard-actions';
import { endpointSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { endpointListKey, EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { endpointEntitySchema } from '../../../../base-entity-schemas';
import { GlobalEventService, IGlobalEvent } from '../../../global-events.service';
import { InternalEventMonitorFactory } from '../../../monitors/internal-event-monitor.factory';
import { PaginationMonitor } from '../../../monitors/pagination-monitor';


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

  public eventMinimized$: Observable<boolean>;
  public errorMessage$: Observable<string>;
  endpointId: any;

  constructor(
    private internalEventMonitorFactory: InternalEventMonitorFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<CFAppState>,
    private eventService: GlobalEventService,
  ) {
    this.eventMinimized$ = this.store.select('dashboard').pipe(
      map(dashboardState => dashboardState.headerEventMinimized),
      distinctUntilChanged()
    );
  }

  public toggleEvent() { // TODO: RC Rename
    this.store.dispatch(new ToggleHeaderEvent());
  }

  // public dismissEndpointErrors(endpointGuid: string) {
  //   this.store.dispatch(new SendClearEndpointEventsAction(endpointGuid));
  // }

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
      // this.errorMessage$ = combineLatest(
      //   cfEndpointEventMonitor.hasErroredOverTime(),
      //   endpointMonitor.currentPage$
      // ).pipe(
      //   filter(([errors]) => !!Object.keys(errors).length),
      //   map(([errors, endpoints]) => {
      //     const endpointString = Object.keys(errors)
      //       // const keys = errors ? Object.keys(errors) : null;
      //       // if (!keys || !keys.length) {
      //       //   return null;
      //       // }
      //       // console.log(keys);
      //       // const endpointString = keys
      //       .map(id => endpoints.find(endpoint => {
      //         return endpoint.guid === id;
      //       }))
      //       .reduce((message, endpoint, index, { length }) => {
      //         const endpointName = endpoint.name;
      //         if (index === 0) {
      //           return endpointName;
      //         }
      //         return index + 1 === length ? `${message} & ${endpointName}` : `${message}, ${endpointName}`;
      //       }, '');
      //     return `We've been having trouble communicating with ${endpointString}`;
      //   })
      // );
      this.errorMessage$ = combineLatest(
        this.eventService.events$,
        endpointMonitor.currentPage$
      ).pipe(
        map(([events, endpoints]) => {
          return [events.filter(event => event.key === 'endpointError' && !event.read), endpoints];
        }),
        filter(([events]) => !!Object.keys(events).length),
        map(([events, endpoints]: [IGlobalEvent[], EndpointModel[]]) => {
          return events.length > 1 ? `There are multiple endpoints with errors.` : event[0].message;
        })
      );
    }
  }
}
