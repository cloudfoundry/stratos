import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';

/** Overlay indicator pool: concentric portal rings or the breathing brand mark. */
export type LoadingPageVariant = 'rings' | 'logo';

const VARIANT_POOL: readonly LoadingPageVariant[] = ['rings', 'logo'];

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

  readonly text = input('Retrieving your data');

  @Input()
  alert = '';

  /** Pin an indicator look; omitted → deterministic pick from the pool
   *  keyed on `text`, so a given page keeps one look across visits while
   *  different pages vary. */
  readonly variant = input<LoadingPageVariant>();

  private branding = inject(StratosBrandingService, { optional: true });

  protected readonly themeLogo = computed(
    () => this.branding?.theme()?.branding?.logo || '/core/assets/logo.png',
  );

  protected resolved(): LoadingPageVariant {
    const variant = this.variant();
    if (variant) return variant;
    let h = 0;
    for (let i = 0; i < this.text().length; i++) {
      h = (h * 31 + this.text().charCodeAt(i)) | 0;
    }
    return VARIANT_POOL[Math.abs(h) % VARIANT_POOL.length];
  }

  ngOnInit() {
    if (!this.isLoading) {
      this.isLoading = new BehaviorSubject(false);
    }
  }
}
