import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { internalEventSubjectsSelector } from '../../../../store/selectors/internal-events.selectors';
import { endpointSchemaKey } from '../../../../store/helpers/entity-factory';
import { filter, map, tap } from 'rxjs/operators';
import { InternalEventServerity } from '../../../../store/types/internal-events.types';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { trigger, transition, style, animate } from '@angular/animations';

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
    this.endpointErrors$ = this.store.select(internalEventSubjectsSelector(endpointSchemaKey, this.endpointIds)).pipe(
      filter(state => !!Object.keys(state).length),
      map(state => {
        return Object.keys(state).reduce<string[]>((array, key) => {
          const events = state[key];
          const hasErrorEvent = !!events.find(event => {
            return event.serverity === InternalEventServerity.ERROR;
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

  ngOnInit() {
  }

}
