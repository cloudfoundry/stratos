import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { EntitySchema, EntityMonitor, EntityMonitorFactory } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, startWith } from 'rxjs/operators';

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

  @Input()
  isLoading: Observable<boolean>;

  @Input()
  text = 'Retrieving your data';

  @Input()
  deleteText = 'Deleting data';

  @Input()
  alert = '';

  @Input()
  entityId: string;

  @Input()
  entitySchema: EntitySchema;

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
      this.buildFromMonitor(this.entityMonitorFactory.create(this.entityId, this.entitySchema));
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
    this.isLoading = monitor.isFetchingEntity$;
  }
}
