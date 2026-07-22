import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { take, map, publishReplay, refCount, share } from 'rxjs/operators';

import { endpointEventKey, GlobalEventService, IGlobalEvent } from '../../../global-events.service';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-page-header-events',
  templateUrl: './page-header-events.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent
  ],
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderEventsComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private eventService = inject(GlobalEventService);

  @Input()
  public endpointIds$!: Observable<string[]>;
  @Input()
  public simpleErrorMessage = false;

  public errorMessage$!: Observable<string>;
  // Emits the single underlying event when only one endpoint is in
  // error AND it carries the structured fields (endpointName /
  // endpointId / detail). Lets the banner render the endpoint
  // identifier as a title above the error detail. Null for multi-
  // endpoint or legacy events where structured fields are absent.
  public singleErrorEvent$!: Observable<IGlobalEvent | null>;
  endpointId: any;
  private events$!: Observable<any>;

  public markEventsAsRead() {
    this.events$.pipe(
      take(1),
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
      this.singleErrorEvent$ = this.events$.pipe(
        map((events: IGlobalEvent[]) => {
          if (!events || events.length === 0) return null;
          const endpointErrorKeys = events.reduce(
            (ids, event) => ids.add(this.getEndpointId(event)),
            new Set<string>(),
          );
          if (endpointErrorKeys.size !== 1) return null;
          // Only switch to structured rendering when the event carries
          // the title/body fields; legacy ngrx events fall back to the
          // flat message string via errorMessage$.
          const e = events[0];
          return e.endpointName && e.detail ? e : null;
        }),
        share(),
      );
    }
  }

  private getEndpointId(event: IGlobalEvent): string {
    // Prefer the structured field on signal-published events (no link
    // is set — the per-endpoint history page renders empty for
    // signal-only events so the View button is intentionally hidden).
    // Fall back to legacy /errors/{guid} link parsing for ngrx-derived
    // events (endpointEventKey config in app.module).
    if (event.endpointId) return event.endpointId;
    return event.link?.split('/')[2] ?? '';
  }
}
