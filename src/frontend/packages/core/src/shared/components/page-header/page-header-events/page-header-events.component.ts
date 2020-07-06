import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { first, map, publishReplay, refCount, share } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { endpointEventKey, GlobalEventService, IGlobalEvent } from '../../../global-events.service';


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
  private events$: Observable<any>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private eventService: GlobalEventService,
  ) { }

  public markEventsAsRead() {
    this.events$.pipe(
      first(),
    ).subscribe((events: IGlobalEvent[]) => {
      if (events && !!events.length) {
        events.forEach(event => this.eventService.updateEventReadState(event, true));
      }
    });
  }

  ngOnInit() {
    this.endpointId = this.activatedRoute.snapshot.params && this.activatedRoute.snapshot.params.endpointId ?
      this.activatedRoute.snapshot.params.endpointId : null;
    if (!this.endpointIds$ && this.endpointId) {
      this.endpointIds$ = observableOf([this.endpointId]);
    }
    if (this.endpointIds$) {
      this.events$ = combineLatest(
        this.eventService.events$,
        this.endpointIds$,
      ).pipe(
        map(([events, endpointIds]) => {
          const filteredEvents = events.filter(event => {
            // Is it an error of type endpoint?
            if (event.key.startsWith(endpointEventKey)) {
              const endpointId = this.getEndpointId(event);
              // Is it an endpoint error for an endpoint we're interested in?
              const relevantEndpoint = endpointIds.find(id => id === endpointId);
              const unread = !event.read;
              return relevantEndpoint && unread;
            }
          });
          return filteredEvents;
        }),
        publishReplay(1),
        refCount()
      );
      this.errorMessage$ = this.events$.pipe(
        // Fixme this emits a lot, we should fix this.
        map((events: IGlobalEvent[]) => {
          if (!events || events.length === 0) {
            return '';
          }
          const endpointErrorKeys = events.reduce((endpointIds, event) => {
            return endpointIds.add(this.getEndpointId(event));
          }, new Set<string>());
          return endpointErrorKeys.size > 1 ? `There are multiple endpoints with errors` : events[0].message;
        }),
        share()
      );
    }
  }

  private getEndpointId(event: IGlobalEvent): string {
    return event.link.split('/')[2];
  }
}
