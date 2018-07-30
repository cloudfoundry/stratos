import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { schema } from 'normalizr';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, startWith, tap, debounce, debounceTime } from 'rxjs/operators';

import { EntityMonitor } from '../../monitors/entity-monitor';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';


@Component({
  selector: 'app-loading-page',
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.scss'],
  animations: [
    trigger(
      'leaveLoaderAnimation', [
        transition(':leave', [
          style({ opacity: 1 }),
          animate('250ms ease-out', style({ opacity: 0 }))
        ])
      ]
    )
  ]
})
export class LoadingPageComponent implements OnInit {


  constructor(private entityMonitorFactory: EntityMonitorFactory) { }

  @Input('isLoading')
  isLoading: Observable<boolean>;

  @Input('text')
  text = 'Retrieving your data';

  @Input('deleteText')
  deleteText = 'Deleting data';

  @Input('alert')
  alert = '';

  @Input('entityId')
  private entityId: string;

  @Input('entitySchema')
  private entitySchema: schema.Entity;

  public isDeleting: Observable<boolean>;

  public text$: Observable<string>;

  ngOnInit() {
    if (this.isLoading) {
      this.isLoading
        .pipe(
          filter(loading => !loading),
          first()
        );
      this.isDeleting = observableOf(false);
    } else if (this.entityId && this.entitySchema) {
      this.buildFromMonitor(this.entityMonitorFactory.create(this.entityId, this.entitySchema.key, this.entitySchema));
    } else {
      this.isLoading = this.isDeleting = observableOf(false);
    }
    this.text$ = combineLatest(
      this.isLoading.pipe(startWith(false)),
      this.isDeleting.pipe(startWith(false))
    ).pipe(
      map(([isLoading, isDeleting]) => {
        if (isDeleting) {
          return this.deleteText;
        } else if (isLoading) {
          return this.text;
        }
        return '';
      })
    );
  }

  private buildFromMonitor(monitor: EntityMonitor) {
    this.isDeleting = monitor.isDeletingEntity$;
    this.isLoading = combineLatest(
      monitor.isFetchingEntity$.pipe(
        // There's a brief amount of time between the monitor returning an initial 'false' value before the validation code kicks
        // in and marks as 'updating' (true + false --> false + false --> false --> true). Add some artificial lag here until we find a
        // better solution
        debounceTime(50)
      ),
      monitor.updatingSection$
    ).pipe(
      map(([fetching, updating]) => {
        return fetching || updating._root_.busy;
      }),
      startWith(true),
    );
  }
}
