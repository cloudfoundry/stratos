import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { filter, map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

import { AppState } from '../../../../store/app-state';
import { endpointSchemaKey } from '../../../../store/helpers/entity-factory';
import { internalEventTypeSelector } from '../../../../store/selectors/internal-events.selectors';
import { InternalEventServerity, InternalEventSubjectState } from '../../../../store/types/internal-events.types';

import * as moment from 'moment';

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
  @Input('endpointIds')
  public endpointIds: string[] = [];

  public endpointErrors$: Observable<string[]>;

  constructor(private store: Store<AppState>, private activatedRoute: ActivatedRoute) {
    if (!this.endpointIds.length && activatedRoute.snapshot.params.cfId) {
      this.endpointIds.push(activatedRoute.snapshot.params.cfId);
    }
    const endpointEvents$ = this.store.select(internalEventTypeSelector(endpointSchemaKey)).pipe(
      debounceTime(250),
      distinctUntilChanged(),
      map(allEvents => {
        console.log('event.timestamp');
        const events = {} as InternalEventSubjectState;
        this.endpointIds.forEach(id => {
          if (allEvents[id]) {
            events[id] = allEvents[id];
          }
        });
        return events;
      })
    );
    const interval$ = new IntervalObservable(30000).startWith(-1);
    this.endpointErrors$ = combineLatest(endpointEvents$, interval$).pipe(
      filter(([state]) => !!Object.keys(state).length),
      map(([state]) => {
        const time = moment().subtract(5, 'hours').unix() * 1000;
        return Object.keys(state).reduce<string[]>((array, key) => {
          const events = state[key];
          const hasErrorEvent = !!events.find(event => {
            return event.serverity === InternalEventServerity.ERROR && event.timestamp > time;
          });
          if (hasErrorEvent) {
            array.push(key);
          }
          return array;
        }, []);
      }),
      filter(events => !!events.length)
    );
  }

  private searchEventsForErrors(events) {
    const index = Math.round(events.length / 2);
  }
  private checkIndex(events, index) {
    const event = events[index];
  }
  ngOnInit() {
  }
}
