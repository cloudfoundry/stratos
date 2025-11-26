import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, Input, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { type EntitySchema, EntityMonitor, EntityMonitorFactory } from '@stratosui/store';
import { BehaviorSubject, combineLatest, type Observable, } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
selector: 'app-loading-page',
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
  ],
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
  private entityMonitorFactory = inject(EntityMonitorFactory);

  @Input()
  isLoading!: Observable<boolean>;

  @Input()
  text = 'Retrieving your data';

  @Input()
  deleteText = 'Deleting data';

  @Input()
  alert = '';

  @Input()
  entityId!: string;

  @Input()
  entitySchema!: EntitySchema;

  public isDeleting!: Observable<boolean>;

  public text$!: Observable<string>;

  ngOnInit() {
    if (this.isLoading) {
      // isLoading is already provided as an input
      this.isDeleting = new BehaviorSubject(false);
    } else if (this.entityId && this.entitySchema) {
      this.buildFromMonitor(this.entityMonitorFactory.create(this.entityId, this.entitySchema));
    } else {
      this.isLoading = new BehaviorSubject(false);
      this.isDeleting = new BehaviorSubject(false);
    }

    this.text$ = combineLatest([
      this.isLoading,
      this.isDeleting
    ]).pipe(
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
