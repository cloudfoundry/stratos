import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  // Caller supplies a loading stream directly. The ngrx EntityMonitor-driven
  // path (entityId/entitySchema → isFetching/isDeleting) was removed: the
  // detail pages that used it now pass their signal-native isLoading, and the
  // delete flow navigates away rather than painting a "deleting" overlay here.
  @Input()
  isLoading!: Observable<boolean>;

  @Input()
  text = 'Retrieving your data';

  @Input()
  alert = '';

  ngOnInit() {
    if (!this.isLoading) {
      this.isLoading = new BehaviorSubject(false);
    }
  }
}
